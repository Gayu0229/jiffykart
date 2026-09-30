package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Notification;
import com.jiffikart.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(Role role);
    long countByRecipientIdAndIsReadFalse(Long recipientId);
}
