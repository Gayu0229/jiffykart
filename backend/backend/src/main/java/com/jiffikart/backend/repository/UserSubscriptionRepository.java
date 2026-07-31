package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.SubscriptionStatus;
import com.jiffikart.backend.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findByUserIdAndStatus(Long userId, SubscriptionStatus status);
    List<UserSubscription> findByStatus(SubscriptionStatus status);
    List<UserSubscription> findByStatusAndEndDateBefore(SubscriptionStatus status, LocalDateTime date);
    Optional<UserSubscription> findByPaymentId(String paymentId);
    List<UserSubscription> findAllByOrderByCreatedAtDesc();
}
