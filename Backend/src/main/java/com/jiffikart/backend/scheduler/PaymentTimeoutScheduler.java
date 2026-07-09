package com.jiffikart.backend.scheduler;

import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.repository.OrderRepository;
import com.jiffikart.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentTimeoutScheduler {

    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    /**
     * Runs every minute to cancel pending UPI QR payments older than 10 minutes.
     */
    @Scheduled(fixedRate = 60000)
    public void cancelExpiredUpiPayments() {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(10);
        
        List<Order> expiredOrders = orderRepository.findAll().stream()
                .filter(o -> "UPI_QR".equalsIgnoreCase(o.getPaymentProvider()))
                .filter(o -> "PENDING".equalsIgnoreCase(o.getPaymentStatus()))
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isBefore(timeoutThreshold))
                .collect(Collectors.toList());

        if (!expiredOrders.isEmpty()) {
            log.info("Found {} expired UPI QR payments. Cancelling...", expiredOrders.size());
            for (Order order : expiredOrders) {
                order.setPaymentStatus("TIMEOUT");
                order.setOrderStatus("CANCELLED");
                orderRepository.save(order);
                notificationService.notifyOrderStatusChange(order.getUser().getId(), order.getId(), "CANCELLED (Payment Timeout)");
                log.info("Cancelled Order ID: {} due to payment timeout", order.getId());
            }
        }
    }
}
