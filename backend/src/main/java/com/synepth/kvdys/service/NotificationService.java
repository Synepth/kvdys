package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.NotificationResponse;
import com.synepth.kvdys.entity.Notification;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.NotificationRepository;
import com.synepth.kvdys.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification createNotification(User recipient, User actor, String title, String message, String targetUrl, String type) {
        if (recipient == null) {
            return null;
        }

        // Do not notify user of their own action
        if (actor != null && recipient.getId().equals(actor.getId())) {
            return null;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetUrl(targetUrl);
        notification.setType(type);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + notificationId));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<Notification> unreadList = notificationRepository.findByRecipientIdAndIsReadFalse(user.getId());
        for (Notification n : unreadList) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unreadList);
    }

    public NotificationResponse mapToResponse(Notification n) {
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setRecipientId(n.getRecipient() != null ? n.getRecipient().getId() : null);
        res.setTitle(n.getTitle());
        res.setMessage(n.getMessage());
        res.setTargetUrl(n.getTargetUrl());
        res.setType(n.getType());
        res.setRead(n.isRead());
        res.setCreatedAt(n.getCreatedAt());

        if (n.getActor() != null) {
            res.setActorId(n.getActor().getId());
            res.setActorUsername(n.getActor().getUsername());
            res.setActorAvatarUrl(n.getActor().getAvatarUrl());
            String fullName = ((n.getActor().getFirstName() != null ? n.getActor().getFirstName() : "") + " " +
                               (n.getActor().getLastName() != null ? n.getActor().getLastName() : "")).trim();
            res.setActorName(fullName.isEmpty() ? n.getActor().getUsername() : fullName);
        }

        return res;
    }
}
