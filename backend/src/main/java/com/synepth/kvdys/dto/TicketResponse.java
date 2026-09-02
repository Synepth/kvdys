package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;

    // Creator info
    private Long createdById;
    private String createdByUsername;
    private String createdByName;

    // Assigned staff info (can be null)
    private Long assignedUserId;
    private String assignedUsername;
    private String assignedName;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Quick counts for UI badges
    private int commentCount;
    private int attachmentCount;
}
