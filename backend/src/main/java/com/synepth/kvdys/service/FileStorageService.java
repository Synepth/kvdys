package com.synepth.kvdys.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${upload.path}")
    private String uploadPath;

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final long MAX_SIZE = 5 * 1024 * 1024;

    public String storeAvatar(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Only JPEG, PNG, GIF, and WebP images are allowed.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new RuntimeException("File size must be less than 5MB.");
        }

        try {
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/avatars/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }

    public void deleteAvatar(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) return;
        try {
            String filename = avatarUrl.substring(avatarUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadPath).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
        }
    }

    // ==================== TICKET ATTACHMENTS ====================

    @Value("${upload.tickets.path:uploads/tickets}")
    private String ticketUploadPath;

    private static final long MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

    public String storeTicketAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty.");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new RuntimeException("File size must be less than 10MB.");
        }

        try {
            Path uploadDir = Paths.get(ticketUploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/tickets/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment: " + e.getMessage());
        }
    }

    public void deleteTicketAttachment(String attachmentUrl) {
        if (attachmentUrl == null || attachmentUrl.isBlank()) return;
        try {
            String filename = attachmentUrl.substring(attachmentUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(ticketUploadPath).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
        }
    }
}
