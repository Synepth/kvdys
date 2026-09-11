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

    private Long createdById;
    private String createdByUsername;
    private String createdByName;

    private Long assignedUserId;
    private String assignedUsername;
    private String assignedName;

    private Long assetId;
    private String assetName;
    private String assetSerialNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private int commentCount;
    private int attachmentCount;
}
