package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {

    private Long id;
    private String fileName;
    private String filePath;
    private String contentType;
    private Long fileSize;
    private Long uploadedById;
    private String uploadedByUsername;
    private LocalDateTime createdAt;
}
