package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.SubscriptionPlan;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.entity.UserSubscription;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return userRepository.findById(Long.parseLong(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }

    /**
     * GET /api/subscriptions/plans — Public: returns all active plans
     */
    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
    }

    /**
     * POST /api/subscriptions/purchase — Purchase a subscription plan
     * Body: { "planId": 2 }
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> purchase(@RequestBody Map<String, Long> body) {
        User user = getCurrentUser();
        Long planId = body.get("planId");
        if (planId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "planId is required"));
        }
        try {
            Map<String, Object> result = subscriptionService.purchasePlan(user.getId(), planId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Subscription purchase failed", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/subscriptions/my — Current user's active subscription
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMySubscription() {
        User user = getCurrentUser();
        Optional<UserSubscription> sub = subscriptionService.getUserActiveSubscription(user.getId());
        if (sub.isPresent()) {
            UserSubscription s = sub.get();
            return ResponseEntity.ok(Map.of(
                    "id", s.getId(),
                    "planName", s.getPlan().getPlanName(),
                    "price", s.getPlan().getPrice(),
                    "startDate", s.getStartDate().toString(),
                    "endDate", s.getEndDate().toString(),
                    "status", s.getStatus().name(),
                    "cashbackPercent", s.getPlan().getCashbackPercent(),
                    "freeDeliveryAll", s.getPlan().getFreeDeliveryAll(),
                    "freeDeliveryAbove", s.getPlan().getFreeDeliveryAbove() != null ? s.getPlan().getFreeDeliveryAbove() : "",
                    "priorityDelivery", s.getPlan().getPriorityDelivery()
            ));
        }
        return ResponseEntity.ok(Map.of("planName", "Free", "status", "NONE"));
    }

    /**
     * POST /api/subscriptions/cancel — Cancel active subscription
     */
    @PostMapping("/cancel")
    public ResponseEntity<?> cancel() {
        User user = getCurrentUser();
        boolean success = subscriptionService.cancelSubscription(user.getId());
        return ResponseEntity.ok(Map.of("success", success));
    }

    /**
     * GET /api/subscriptions/status — Check if subscription is active
     */
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        User user = getCurrentUser();
        boolean active = subscriptionService.isSubscriptionActive(user.getId());
        Map<String, Object> benefits = subscriptionService.getSubscriptionBenefits(user.getId());
        benefits.put("active", active);
        return ResponseEntity.ok(benefits);
    }
}
