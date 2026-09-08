package com.synepth.kvdys.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketUpdateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    @NotBlank(message = "Category is required")
    private String category;
    @NotBlank(message = "Priority is required")
    private String priority;
    @NotBlank(message = "Status is required")
    private String status;
    private Long assignedUserId;

    private Long assetId;

}
