package com.jiffikart.backend.scheduler;

import com.jiffikart.backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionExpiryScheduler {

    private final SubscriptionService subscriptionService;

    /**
     * Runs daily at midnight to expire overdue subscriptions.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void expireSubscriptions() {
        log.info("Running subscription expiry job...");
        int count = subscriptionService.expireSubscriptions();
        log.info("Subscription expiry job completed. Expired: {}", count);
    }
}
