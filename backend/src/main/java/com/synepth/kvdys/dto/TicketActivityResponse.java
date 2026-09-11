package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketActivityResponse {

    private Long id;
    private Long ticketId;
    private Long actorId;
    private String actorUsername;
    private String actorName;
    private String actorAvatarUrl;
    private String actionType;
    private String description;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;
}
