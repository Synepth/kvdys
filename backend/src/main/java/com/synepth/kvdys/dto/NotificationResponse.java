package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long recipientId;
    private Long actorId;
    private String actorName;
    private String actorUsername;
    private String actorAvatarUrl;
    private String title;
    private String message;
    private String targetUrl;
    private String type;
    private boolean isRead;
    private LocalDateTime createdAt;
}
