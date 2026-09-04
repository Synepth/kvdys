package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.*;
import com.synepth.kvdys.entity.Attachment;
import com.synepth.kvdys.entity.Comment;
import com.synepth.kvdys.entity.Ticket;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.AttachmentRepository;
import com.synepth.kvdys.repository.CommentRepository;
import com.synepth.kvdys.repository.TicketRepository;
import com.synepth.kvdys.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public Page<TicketResponse> getAllTickets(String search, String status, String category, String priority, Pageable pageable) {
        return ticketRepository.findByFilters(search, status, category, priority, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + id));
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

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Transactional
    public TicketResponse updateTicket(Long id, TicketUpdateRequest request, String currentUsername) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

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

        Ticket updated = ticketRepository.save(ticket);
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

        // 3. Delete the ticket
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

        res.setCommentCount(commentRepository.countByTicketId(ticket.getId()));
        res.setAttachmentCount(attachmentRepository.countByTicketId(ticket.getId()));

        return res;
    }

    // COMMENTS

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByTicketId(Long ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new RuntimeException("Support request not found with ID: " + ticketId);
        }
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToCommentResponse)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, CommentCreateRequest request, String currentUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));

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
        if (!ticketRepository.existsById(ticketId)) {
            throw new RuntimeException("Support request not found with ID: " + ticketId);
        }
        return attachmentRepository.findByTicketId(ticketId)
                .stream()
                .map(this::mapToAttachmentResponse)
                .toList();
    }

    @Transactional
    public AttachmentResponse uploadAttachment(Long ticketId, MultipartFile file, String currentUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support request not found with ID: " + ticketId));

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

        fileStorageService.deleteTicketAttachment(attachment.getFilePath());
        attachmentRepository.delete(attachment);
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
        return attachment;
    }

    public Resource loadAttachmentFile(String filePath) {
        return fileStorageService.loadTicketAttachmentAsResource(filePath);
    }
}