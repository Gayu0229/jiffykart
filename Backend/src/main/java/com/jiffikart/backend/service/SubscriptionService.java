package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PhonePeService phonePeService;
    private final EmailService emailService;

    // ─── Plan Management ───

    public List<SubscriptionPlan> getAllActivePlans() {
        return planRepository.findByIsActiveTrue();
    }

    public SubscriptionPlan createPlan(SubscriptionPlan plan) {
        return planRepository.save(plan);
    }

    public SubscriptionPlan updatePlan(Long id, SubscriptionPlan updated) {
        SubscriptionPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        if (updated.getPlanName() != null) plan.setPlanName(updated.getPlanName());
        if (updated.getPrice() != null) plan.setPrice(updated.getPrice());
        if (updated.getDurationDays() != null) plan.setDurationDays(updated.getDurationDays());
        if (updated.getFreeDeliveryAbove() != null) plan.setFreeDeliveryAbove(updated.getFreeDeliveryAbove());
        if (updated.getFreeDeliveryAll() != null) plan.setFreeDeliveryAll(updated.getFreeDeliveryAll());
        if (updated.getPriorityDelivery() != null) plan.setPriorityDelivery(updated.getPriorityDelivery());
        if (updated.getCashbackPercent() != null) plan.setCashbackPercent(updated.getCashbackPercent());
        if (updated.getDescription() != null) plan.setDescription(updated.getDescription());
        if (updated.getIsActive() != null) plan.setIsActive(updated.getIsActive());
        return planRepository.save(plan);
    }

    // ─── Purchase Flow ───

    @Transactional
    public Map<String, Object> purchasePlan(Long userId, Long planId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (plan.getPrice() == 0) {
            // Free plan — activate immediately
            return activateFreePlan(user, plan);
        }

        // Cancel any existing active subscription
        subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(SubscriptionStatus.CANCELLED);
                    subscriptionRepository.save(existing);
                });

        // Initiate PhonePe payment
        String merchantTxnId = "SUB-" + userId + "-" + System.currentTimeMillis();
        Map<String, Object> paymentResponse = phonePeService.initiatePayment(
                merchantTxnId, userId, plan.getPrice()
        );

        // Create pending subscription
        UserSubscription subscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(plan.getDurationDays()))
                .status(SubscriptionStatus.ACTIVE) // Will be set on callback
                .paymentId(merchantTxnId)
                .build();
        // Mark as pending until payment succeeds
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscriptionRepository.save(subscription);

        Map<String, Object> result = new HashMap<>();
        result.put("paymentResponse", paymentResponse);
        result.put("merchantTransactionId", merchantTxnId);
        result.put("subscriptionId", subscription.getId());
        return result;
    }

    private Map<String, Object> activateFreePlan(User user, SubscriptionPlan plan) {
        // Cancel existing active subscription
        subscriptionRepository.findByUserIdAndStatus(user.getId(), SubscriptionStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(SubscriptionStatus.CANCELLED);
                    subscriptionRepository.save(existing);
                });

        UserSubscription subscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(plan.getDurationDays()))
                .status(SubscriptionStatus.ACTIVE)
                .paymentId("FREE")
                .build();
        subscriptionRepository.save(subscription);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Free plan activated");
        result.put("subscription", subscription);
        return result;
    }

    // ─── Payment Callback Activation ───

    @Transactional
    public boolean activateSubscription(String merchantTransactionId) {
        Optional<UserSubscription> optSub = subscriptionRepository.findByPaymentId(merchantTransactionId);
        if (optSub.isEmpty()) {
            log.error("No subscription found for payment: {}", merchantTransactionId);
            return false;
        }

        UserSubscription subscription = optSub.get();
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusDays(subscription.getPlan().getDurationDays()));
        subscriptionRepository.save(subscription);

        // Send activation email
        try {
            User user = subscription.getUser();
            emailService.sendSubscriptionActivatedEmail(
                    user.getEmail(),
                    user.getName(),
                    subscription.getPlan().getPlanName(),
                    subscription.getPlan().getDurationDays()
            );
        } catch (Exception e) {
            log.error("Failed to send subscription activation email", e);
        }

        log.info("Subscription activated for payment: {}", merchantTransactionId);
        return true;
    }

    // ─── User Queries ───

    public Optional<UserSubscription> getUserActiveSubscription(Long userId) {
        return subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE);
    }

    public boolean isSubscriptionActive(Long userId) {
        return subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .map(sub -> sub.getEndDate().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    @Transactional
    public boolean cancelSubscription(Long userId) {
        Optional<UserSubscription> optSub = subscriptionRepository
                .findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE);
        if (optSub.isEmpty()) return false;

        UserSubscription sub = optSub.get();
        sub.setStatus(SubscriptionStatus.CANCELLED);
        subscriptionRepository.save(sub);
        return true;
    }

    // ─── Benefits Logic ───

    public Map<String, Object> getSubscriptionBenefits(Long userId) {
        Map<String, Object> benefits = new HashMap<>();
        benefits.put("freeDeliveryAll", false);
        benefits.put("freeDeliveryAbove", null);
        benefits.put("priorityDelivery", false);
        benefits.put("cashbackPercent", 0.0);
        benefits.put("planName", "Free");

        Optional<UserSubscription> optSub = getUserActiveSubscription(userId);
        if (optSub.isPresent()) {
            UserSubscription sub = optSub.get();
            if (sub.getEndDate().isAfter(LocalDateTime.now())) {
                SubscriptionPlan plan = sub.getPlan();
                benefits.put("freeDeliveryAll", plan.getFreeDeliveryAll());
                benefits.put("freeDeliveryAbove", plan.getFreeDeliveryAbove());
                benefits.put("priorityDelivery", plan.getPriorityDelivery());
                benefits.put("cashbackPercent", plan.getCashbackPercent());
                benefits.put("planName", plan.getPlanName());
            }
        }
        return benefits;
    }

    // ─── Expiry Job ───

    @Transactional
    public int expireSubscriptions() {
        List<UserSubscription> expired = subscriptionRepository
                .findByStatusAndEndDateBefore(SubscriptionStatus.ACTIVE, LocalDateTime.now());

        for (UserSubscription sub : expired) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);

            // Send expiry email
            try {
                User user = sub.getUser();
                emailService.sendSubscriptionExpiredEmail(
                        user.getEmail(),
                        user.getName(),
                        sub.getPlan().getPlanName()
                );
            } catch (Exception e) {
                log.error("Failed to send subscription expiry email for user {}", sub.getUser().getId(), e);
            }
        }

        log.info("Expired {} subscriptions", expired.size());
        return expired.size();
    }

    // ─── Admin Analytics ───

    public List<UserSubscription> getAllSubscriptions() {
        return subscriptionRepository.findAllByOrderByCreatedAtDesc();
    }

    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        List<UserSubscription> active = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        analytics.put("totalActive", active.size());
        analytics.put("totalRevenue", active.stream()
                .mapToDouble(s -> s.getPlan().getPrice()).sum());
        analytics.put("totalSubscriptions", subscriptionRepository.count());
        return analytics;
    }
}
