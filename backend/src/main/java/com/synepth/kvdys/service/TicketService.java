package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.*;
import com.synepth.kvdys.entity.*;
import com.synepth.kvdys.repository.*;
import lombok.RequiredArgsConstructor;
import com.synepth.kvdys.util.CsvExportUtil;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final TicketActivityRepository ticketActivityRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final FileStorageService fileStorageService;

    private Long resolveScopedUserId() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        boolean canViewAll = auth.getAuthorities().stream().anyMatch(a ->
                "TICKETS_VIEW_ALL".equals(a.getAuthority()) ||
                "ROLE_ADMIN".equals(a.getAuthority())
        );
        if (canViewAll) {
            return null; // Unrestricted: staff and admins view all company tickets
        }
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        return user != null ? user.getId() : -1L; // Restricted: normal users only view their created or assigned tickets
    }

    private void checkTicketAccess(Ticket ticket) {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return;
        boolean canViewAll = auth.getAuthorities().stream().anyMatch(a ->
                "TICKETS_VIEW_ALL".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority())
        );
        if (canViewAll) return;

        User currentUser = userRepository.findByUsername(auth.getName()).orElse(null);
        if (currentUser == null) {
            throw new RuntimeException("User not authenticated.");
        }

        boolean isCreator = ticket.getCreatedBy() != null && ticket.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAssignee = ticket.getAssignedUser() != null && ticket.getAssignedUser().getId().equals(currentUser.getId());

        if (!isCreator && !isAssignee) {
            throw new RuntimeException("You do not have permission to view this support request.");
        }
    }

    @Transactional(readOnly = true)
    public Page<TicketResponse> getAllTickets(String search, String status, String category, String priority,
                                            Long assignedUserId, Boolean unassigned, Pageable pageable) {
        Long scopedUserId = resolveScopedUserId();
        return ticketRepository.findByFilters(search, status, category, priority, assignedUserId, unassigned, scopedUserId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + id));
        checkTicketAccess(ticket);
        return mapToResponse(ticket);
    }

    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + currentUsername));

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setStatus("Open");
        ticket.setCreatedBy(currentUser);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        if (request.getAssignedUserId() != null) {
            User assigned = userRepository.findById(request.getAssignedUserId()).orElse(null);
            ticket.setAssignedUser(assigned);
        }

        if (request.getAssetId() != null) {
            Asset asset = assetRepository.findById(request.getAssetId()).orElse(null);
            ticket.setAsset(asset);
        }

        Ticket saved = ticketRepository.save(ticket);

        recordActivity(saved, currentUser, "CREATED",
                "Support request created with status 'Open' and priority '" + saved.getPriority() + "'",
                null, saved.getStatus());

        if (saved.getAssignedUser() != null) {
            notificationService.createNotification(
                    saved.getAssignedUser(),
                    currentUser,
                    "New Ticket Assigned",
                    "Support request #" + saved.getId() + " (" + saved.getTitle() + ") was assigned to you.",
                    "/tickets?id=" + saved.getId(),
                    "TICKET_ASSIGNED"
            );
        }

        return mapToResponse(saved);
    }

    @Transactional
    public TicketResponse updateTicket(Long id, TicketUpdateRequest request, String currentUsername) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        String oldStatus = ticket.getStatus();
        String oldPriority = ticket.getPriority();
        String oldCategory = ticket.getCategory();
        String oldTitle = ticket.getTitle();
        String oldDescription = ticket.getDescription();
        User oldAssignedUser = ticket.getAssignedUser();
        Asset oldAsset = ticket.getAsset();

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setStatus(request.getStatus());
        ticket.setUpdatedBy(currentUser);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (request.getAssignedUserId() != null) {
            User assigned = userRepository.findById(request.getAssignedUserId()).orElse(null);
            ticket.setAssignedUser(assigned);
        } else {
            ticket.setAssignedUser(null);
        }

        if (request.getAssetId() != null) {
            Asset asset = assetRepository.findById(request.getAssetId()).orElse(null);
            ticket.setAsset(asset);
        } else {
            ticket.setAsset(null);
        }

        Ticket updated = ticketRepository.save(ticket);

        // Record audit activities and send notifications for changes
        if (oldStatus != null && !oldStatus.equalsIgnoreCase(updated.getStatus())) {
            recordActivity(updated, currentUser, "STATUS_CHANGED",
                    "Status changed from '" + oldStatus + "' to '" + updated.getStatus() + "'",
                    oldStatus, updated.getStatus());

            if (updated.getCreatedBy() != null) {
                notificationService.createNotification(
                        updated.getCreatedBy(),
                        currentUser,
                        "Ticket Status Updated",
                        "Support request #" + updated.getId() + " status was changed to '" + updated.getStatus() + "'.",
                        "/tickets?id=" + updated.getId(),
                        "STATUS_CHANGED"
                );
            }

            if (updated.getAssignedUser() != null &&
                    (updated.getCreatedBy() == null || !Objects.equals(updated.getAssignedUser().getId(), updated.getCreatedBy().getId()))) {
                notificationService.createNotification(
                        updated.getAssignedUser(),
                        currentUser,
                        "Ticket Status Updated",
                        "Support request #" + updated.getId() + " status was changed to '" + updated.getStatus() + "'.",
                        "/tickets?id=" + updated.getId(),
                        "STATUS_CHANGED"
                );
            }
        }

        if (oldPriority != null && !oldPriority.equalsIgnoreCase(updated.getPriority())) {
            recordActivity(updated, currentUser, "PRIORITY_CHANGED",
                    "Priority changed from '" + oldPriority + "' to '" + updated.getPriority() + "'",
                    oldPriority, updated.getPriority());
        }

        if (oldCategory != null && !oldCategory.equalsIgnoreCase(updated.getCategory())) {
            recordActivity(updated, currentUser, "CATEGORY_CHANGED",
                    "Category changed from '" + oldCategory + "' to '" + updated.getCategory() + "'",
                    oldCategory, updated.getCategory());
        }

        Long oldAssignedId = oldAssignedUser != null ? oldAssignedUser.getId() : null;
        Long newAssignedId = updated.getAssignedUser() != null ? updated.getAssignedUser().getId() : null;
        if (!Objects.equals(oldAssignedId, newAssignedId)) {
            String oldName = oldAssignedUser != null ? getUserDisplayName(oldAssignedUser) : null;
            String newName = updated.getAssignedUser() != null ? getUserDisplayName(updated.getAssignedUser()) : null;
            if (newName == null) {
                recordActivity(updated, currentUser, "UNASSIGNED",
                        "Unassigned support request (previously assigned to " + oldName + ")",
                        oldName, null);
            } else if (oldName == null) {
                recordActivity(updated, currentUser, "ASSIGNED",
                        "Assigned support request to " + newName,
                        null, newName);
            } else {
                recordActivity(updated, currentUser, "REASSIGNED",
                        "Reassigned support request to " + newName + " (was " + oldName + ")",
                        oldName, newName);
            }

            if (updated.getAssignedUser() != null) {
                notificationService.createNotification(
                        updated.getAssignedUser(),
                        currentUser,
                        "Ticket Assigned",
                        "Support request #" + updated.getId() + " (" + updated.getTitle() + ") was assigned to you.",
                        "/tickets?id=" + updated.getId(),
                        "TICKET_ASSIGNED"
                );
            }
        }

        Long oldAssetId = oldAsset != null ? oldAsset.getId() : null;
        Long newAssetId = updated.getAsset() != null ? updated.getAsset().getId() : null;
        if (!Objects.equals(oldAssetId, newAssetId)) {
            String oldAssetName = oldAsset != null ? (oldAsset.getName() + (oldAsset.getSerialNumber() != null ? " [S/N: " + oldAsset.getSerialNumber() + "]" : "")) : null;
            String newAssetName = updated.getAsset() != null ? (updated.getAsset().getName() + (updated.getAsset().getSerialNumber() != null ? " [S/N: " + updated.getAsset().getSerialNumber() + "]" : "")) : null;
            if (newAssetName == null) {
                recordActivity(updated, currentUser, "ASSET_UNLINKED",
                        "Unlinked corporate asset (" + oldAssetName + ")",
                        oldAssetName, null);
            } else {
                recordActivity(updated, currentUser, "ASSET_LINKED",
                        "Linked corporate asset: " + newAssetName,
                        oldAssetName, newAssetName);
            }
        }

        if (oldTitle != null && !oldTitle.equals(updated.getTitle())) {
            recordActivity(updated, currentUser, "TITLE_CHANGED",
                    "Title changed to: " + updated.getTitle(),
                    oldTitle, updated.getTitle());
        }

        if (oldDescription != null && !oldDescription.equals(updated.getDescription())) {
            recordActivity(updated, currentUser, "DESCRIPTION_CHANGED",
                    "Description updated",
                    null, null);
        }

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + id));

        // 1. Delete physical attachment files from disk and DB records
        List<Attachment> attachments = attachmentRepository.findByTicketId(id);
        for (Attachment att : attachments) {
            fileStorageService.deleteTicketAttachment(att.getFilePath());
        }
        attachmentRepository.deleteAll(attachments);

        // 2. Delete comments
        List<Comment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(id);
        commentRepository.deleteAll(comments);

        // 3. Delete activities
        List<TicketActivity> activities = ticketActivityRepository.findByTicketId(id);
        ticketActivityRepository.deleteAll(activities);

        // 4. Delete the ticket
        ticketRepository.delete(ticket);
    }

    public TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse res = new TicketResponse();
        res.setId(ticket.getId());
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setCategory(ticket.getCategory());
        res.setPriority(ticket.getPriority());
        res.setStatus(ticket.getStatus());
        res.setCreatedAt(ticket.getCreatedAt());
        res.setUpdatedAt(ticket.getUpdatedAt());

        if (ticket.getCreatedBy() != null) {
            res.setCreatedById(ticket.getCreatedBy().getId());
            res.setCreatedByUsername(ticket.getCreatedBy().getUsername());
            String fullName = ((ticket.getCreatedBy().getFirstName() != null ? ticket.getCreatedBy().getFirstName() : "") + " " +
                               (ticket.getCreatedBy().getLastName() != null ? ticket.getCreatedBy().getLastName() : "")).trim();
            res.setCreatedByName(fullName.isEmpty() ? ticket.getCreatedBy().getUsername() : fullName);
        }

        if (ticket.getAssignedUser() != null) {
            res.setAssignedUserId(ticket.getAssignedUser().getId());
            res.setAssignedUsername(ticket.getAssignedUser().getUsername());
            String fullName = ((ticket.getAssignedUser().getFirstName() != null ? ticket.getAssignedUser().getFirstName() : "") + " " +
                               (ticket.getAssignedUser().getLastName() != null ? ticket.getAssignedUser().getLastName() : "")).trim();
            res.setAssignedName(fullName.isEmpty() ? ticket.getAssignedUser().getUsername() : fullName);
        }

        if (ticket.getAsset() != null) {
            res.setAssetId(ticket.getAsset().getId());
            res.setAssetName(ticket.getAsset().getName());
            res.setAssetSerialNumber(ticket.getAsset().getSerialNumber());
        }

        res.setCommentCount(commentRepository.countByTicketId(ticket.getId()));
        res.setAttachmentCount(attachmentRepository.countByTicketId(ticket.getId()));

        return res;
    }

    // COMMENTS

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByTicketId(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));
        checkTicketAccess(ticket);
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToCommentResponse)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, CommentCreateRequest request, String currentUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));
        checkTicketAccess(ticket);

        User author = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + currentUsername));

        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setContent(request.getContent());
        comment.setCreatedAt(LocalDateTime.now());

        Comment saved = commentRepository.save(comment);

        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        recordActivity(ticket, author, "COMMENT_ADDED", "Added a comment", null, null);

        // Notify creator if creator is not the commenter
        if (ticket.getCreatedBy() != null) {
            String authorDisplayName = getUserDisplayName(author);
            String snippet = request.getContent() != null && request.getContent().length() > 60
                    ? request.getContent().substring(0, 57) + "..."
                    : (request.getContent() != null ? request.getContent() : "");
            notificationService.createNotification(
                    ticket.getCreatedBy(),
                    author,
                    "New Comment on Ticket #" + ticket.getId(),
                    authorDisplayName + " commented: \"" + snippet + "\"",
                    "/tickets?id=" + ticket.getId(),
                    "COMMENT_ADDED"
            );
        }

        // Notify assigned user if assigned user is not author and not the creator
        if (ticket.getAssignedUser() != null &&
                (ticket.getCreatedBy() == null || !Objects.equals(ticket.getAssignedUser().getId(), ticket.getCreatedBy().getId()))) {
            String authorDisplayName = getUserDisplayName(author);
            String snippet = request.getContent() != null && request.getContent().length() > 60
                    ? request.getContent().substring(0, 57) + "..."
                    : (request.getContent() != null ? request.getContent() : "");
            notificationService.createNotification(
                    ticket.getAssignedUser(),
                    author,
                    "New Comment on Ticket #" + ticket.getId(),
                    authorDisplayName + " commented: \"" + snippet + "\"",
                    "/tickets?id=" + ticket.getId(),
                    "COMMENT_ADDED"
            );
        }

        return mapToCommentResponse(saved);
    }

    @Transactional
    public void deleteComment(Long ticketId, Long commentId, String currentUsername) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with ID: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new RuntimeException("Comment does not belong to this support request.");
        }

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + currentUsername));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        boolean isAuthor = comment.getAuthor() != null && comment.getAuthor().getId().equals(currentUser.getId());

        if (!isAdmin && !isAuthor) {
            throw new RuntimeException("You do not have permission to delete this comment.");
        }

        Ticket ticket = comment.getTicket();
        recordActivity(ticket, currentUser, "COMMENT_DELETED", "Deleted a comment", null, null);

        commentRepository.delete(comment);
    }

    public CommentResponse mapToCommentResponse(Comment comment) {
        CommentResponse res = new CommentResponse();
        res.setId(comment.getId());
        res.setContent(comment.getContent());
        res.setCreatedAt(comment.getCreatedAt());

        if (comment.getAuthor() != null) {
            res.setAuthorId(comment.getAuthor().getId());
            res.setAuthorUsername(comment.getAuthor().getUsername());
            res.setAuthorAvatarUrl(comment.getAuthor().getAvatarUrl());
            String fullName = ((comment.getAuthor().getFirstName() != null ? comment.getAuthor().getFirstName() : "") + " " +
                               (comment.getAuthor().getLastName() != null ? comment.getAuthor().getLastName() : "")).trim();
            res.setAuthorName(fullName.isEmpty() ? comment.getAuthor().getUsername() : fullName);
        }

        return res;
    }

    //ATTACHMENTS

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getAttachmentsByTicketId(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));
        checkTicketAccess(ticket);
        return attachmentRepository.findByTicketId(ticketId)
                .stream()
                .map(this::mapToAttachmentResponse)
                .toList();
    }

    @Transactional
    public AttachmentResponse uploadAttachment(Long ticketId, MultipartFile file, String currentUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));
        checkTicketAccess(ticket);

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + currentUsername));

        String filePath = fileStorageService.storeTicketAttachment(file);

        Attachment attachment = new Attachment();
        attachment.setTicket(ticket);
        attachment.setUploadedBy(currentUser);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(filePath);
        attachment.setContentType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setCreatedAt(LocalDateTime.now());

        Attachment saved = attachmentRepository.save(attachment);

        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        recordActivity(ticket, currentUser, "ATTACHMENT_UPLOADED",
                "Uploaded attachment: " + file.getOriginalFilename(),
                null, file.getOriginalFilename());

        return mapToAttachmentResponse(saved);
    }

    @Transactional
    public void deleteAttachment(Long ticketId, Long attachmentId, String currentUsername) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found with ID: " + attachmentId));

        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new RuntimeException("Attachment does not belong to this support request.");
        }

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + currentUsername));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        boolean isUploader = attachment.getUploadedBy() != null && attachment.getUploadedBy().getId().equals(currentUser.getId());

        if (!isAdmin && !isUploader) {
            throw new RuntimeException("You do not have permission to delete this attachment.");
        }

        Ticket ticket = attachment.getTicket();
        String fileName = attachment.getFileName();

        fileStorageService.deleteTicketAttachment(attachment.getFilePath());
        attachmentRepository.delete(attachment);

        recordActivity(ticket, currentUser, "ATTACHMENT_DELETED",
                "Deleted attachment: " + fileName,
                fileName, null);
    }

    public AttachmentResponse mapToAttachmentResponse(Attachment attachment) {
        AttachmentResponse res = new AttachmentResponse();
        res.setId(attachment.getId());
        res.setFileName(attachment.getFileName());
        res.setFilePath(attachment.getFilePath());
        res.setContentType(attachment.getContentType());
        res.setFileSize(attachment.getFileSize());
        res.setCreatedAt(attachment.getCreatedAt());

        if (attachment.getUploadedBy() != null) {
            res.setUploadedById(attachment.getUploadedBy().getId());
            res.setUploadedByUsername(attachment.getUploadedBy().getUsername());
        }

        return res;
    }

    @Transactional(readOnly = true)
    public Attachment getAttachmentEntity(Long ticketId, Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found with ID: " + attachmentId));

        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new RuntimeException("Attachment does not belong to this support request.");
        }
        checkTicketAccess(attachment.getTicket());
        return attachment;
    }

    public Resource loadAttachmentFile(String filePath) {
        return fileStorageService.loadTicketAttachmentAsResource(filePath);
    }

    @Transactional(readOnly = true)
    public byte[] exportTicketsToCsv(String search, String status, String category, String priority,
                                     Long assignedUserId, Boolean unassigned) {
        Long scopedUserId = resolveScopedUserId();
        Pageable unpaged = PageRequest.of(0, 10000, Sort.by("id").descending());
        List<Ticket> tickets = ticketRepository.findByFilters(search, status, category, priority, assignedUserId, unassigned, scopedUserId, unpaged).getContent();

        StringBuilder sb = new StringBuilder();
        sb.append(CsvExportUtil.UTF_8_BOM);

        sb.append(CsvExportUtil.toCsvLine(List.of(
                "ID", "Title", "Description", "Status", "Category", "Priority",
                "Created By", "Assigned Staff", "Linked Asset", "Created Date", "Updated Date"
        )));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Ticket ticket : tickets) {
            String createdBy = ticket.getCreatedBy() != null ? ticket.getCreatedBy().getUsername() : "";
            String assignedTo = ticket.getAssignedUser() != null ? ticket.getAssignedUser().getUsername() : "Unassigned";
            String linkedAsset = ticket.getAsset() != null
                    ? ticket.getAsset().getName() + " (" + ticket.getAsset().getSerialNumber() + ")"
                    : "";
            String createdAt = ticket.getCreatedAt() != null ? ticket.getCreatedAt().format(formatter) : "";
            String updatedAt = ticket.getUpdatedAt() != null ? ticket.getUpdatedAt().format(formatter) : "";

            sb.append(CsvExportUtil.toCsvLine(List.of(
                    "#" + ticket.getId(),
                    ticket.getTitle() != null ? ticket.getTitle() : "",
                    ticket.getDescription() != null ? ticket.getDescription() : "",
                    ticket.getStatus() != null ? ticket.getStatus() : "",
                    ticket.getCategory() != null ? ticket.getCategory() : "",
                    ticket.getPriority() != null ? ticket.getPriority() : "",
                    createdBy,
                    assignedTo,
                    linkedAsset,
                    createdAt,
                    updatedAt
            )));
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ==================== ACTIVITIES & AUDIT TRAIL ====================

    @Transactional(readOnly = true)
    public List<TicketActivityResponse> getActivitiesByTicketId(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));
        checkTicketAccess(ticket);
        return ticketActivityRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(this::mapToActivityResponse)
                .toList();
    }

    public TicketActivityResponse mapToActivityResponse(TicketActivity activity) {
        TicketActivityResponse res = new TicketActivityResponse();
        res.setId(activity.getId());
        res.setTicketId(activity.getTicket().getId());
        res.setActionType(activity.getActionType());
        res.setDescription(activity.getDescription());
        res.setOldValue(activity.getOldValue());
        res.setNewValue(activity.getNewValue());
        res.setCreatedAt(activity.getCreatedAt());

        if (activity.getActor() != null) {
            res.setActorId(activity.getActor().getId());
            res.setActorUsername(activity.getActor().getUsername());
            res.setActorAvatarUrl(activity.getActor().getAvatarUrl());
            res.setActorName(getUserDisplayName(activity.getActor()));
        }

        return res;
    }

    private void recordActivity(Ticket ticket, User actor, String actionType, String description, String oldValue, String newValue) {
        TicketActivity activity = new TicketActivity();
        activity.setTicket(ticket);
        activity.setActor(actor);
        activity.setActionType(actionType);
        activity.setDescription(description);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);
        activity.setCreatedAt(LocalDateTime.now());
        ticketActivityRepository.save(activity);
    }

    private String getUserDisplayName(User user) {
        if (user == null) return null;
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " +
                           (user.getLastName() != null ? user.getLastName() : "")).trim();
        return fullName.isEmpty() ? user.getUsername() : fullName;
    }
}