package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.NotificationDTO;
import com.jiffikart.backend.entity.Notification;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.Role;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.NotificationRepository;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create and send a notification to a specific user.
     */
    @Transactional
    public void sendNotification(Long userId, String title, String message, String type, String metadata) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .recipient(user)
                .recipientRole(user.getRole())
                .title(title)
                .message(message)
                .type(type)
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = convertToDTO(saved);

        // Send real-time update
        System.out.println("STOMP DEBUG: Sending to user " + userId + " on /queue/notifications (Type: " + type + ")");
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                dto
        );
    }

    /**
     * Notify users about product updates.
     */
    @Transactional
    public void notifyProductUpdate(Long productId, String message) {
        // For general topics, we might not persist for every user individually 
        // unless we want a global activity feed.
        messagingTemplate.convertAndSend("/topic/products", 
            new NotificationEvent("PRODUCT_UPDATE", productId, message));
    }

    /**
     * Notify a specific user about their order status change.
     */
    @Transactional
    public void notifyOrderStatusChange(Long userId, Long orderId, String status) {
        sendNotification(userId, "Order Update", "Your order is now " + status, "ORDER_STATUS", "{\"orderId\":" + orderId + "}");
    }

    /**
     * Notify vendor about a new order.
     */
    @Transactional
    public void sendNewOrderNotification(Order order) {
        if (order.getShop() != null && order.getShop().getOwner() != null) {
            sendNotification(
                order.getShop().getOwner().getId(),
                "New Order Received",
                "You have a new order #" + order.getId(),
                "NEW_ORDER",
                "{\"orderId\":" + order.getId() + "}"
            );
        }
    }

    /**
     * Notify admins about system alerts.
     */
    @Transactional
    public void notifyAdmin(String alert) {
        // Save to DB for history
        Notification notification = Notification.builder()
                .recipient(null) // Broadcast to role
                .recipientRole(Role.ADMIN)
                .title("Support System Alert")
                .message(alert)
                .type("SYSTEM_ALERT")
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = convertToDTO(saved);

        // Broadcast to existing real-time topic
        messagingTemplate.convertAndSend("/topic/admin", dto);
    }

    public List<NotificationDTO> getNotificationsForUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return java.util.Collections.emptyList();

        // Get personal notifications
        List<Notification> personal = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        
        // Get role-based broadcast notifications (where recipient is null)
        List<Notification> broadcasts = notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(user.getRole())
                .stream()
                .filter(n -> n.getRecipient() == null)
                .collect(Collectors.toList());

        // Merge and sort
        List<Notification> all = new java.util.ArrayList<>();
        all.addAll(personal);
        all.addAll(broadcasts);
        all.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return all.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationDTO convertToDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .metadata(n.getMetadata())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class NotificationEvent {
        private String type;
        private Long targetId;
        private String message;
    }
}
