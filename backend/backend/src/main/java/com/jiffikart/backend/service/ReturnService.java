package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.time.LocalDateTime;

@Service
public class ReturnService {

    @Autowired
    private ReturnRequestRepository returnRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    public ReturnRequest createRequest(ReturnRequest req) {
        ReturnRequest saved = returnRepository.save(req);
        
        // Notify user
        try {
            User user = orderRepository.findById(req.getOrderId()).get().getUser();
            emailService.sendEmail(user.getEmail(), "Return Request Received", 
                "We have received your return request for Order #" + req.getOrderId() + ". We will process it shortly.");
        } catch (Exception e) {}

        return saved;
    }

    public List<ReturnRequest> getUserRequests(Long userId) {
        return returnRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<ReturnRequest> getVendorRequests(Long vendorId) {
        return returnRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }
    
    public List<ReturnRequest> getAllRequests() {
        return returnRepository.findAll();
    }

    @Transactional
    public ReturnRequest updateStatus(Long id, ReturnRequestStatus status, String reason) {
        ReturnRequest req = returnRepository.findById(id).orElseThrow();
        req.setStatus(status);
        if (reason != null) {
            req.setRejectionReason(reason);
        }
        ReturnRequest saved = returnRepository.save(req);

        Order originalOrder = orderRepository.findById(req.getOrderId()).orElse(null);

        if (status == ReturnRequestStatus.APPROVED || status == ReturnRequestStatus.COMPLETED) {
            if (req.getType() == ReturnRequestType.RETURN) {
                // Handle Return Logic
                if (originalOrder != null) {
                    originalOrder.setOrderStatus("RETURN_" + status.name());
                    if (status == ReturnRequestStatus.COMPLETED) {
                        originalOrder.setPaymentStatus("REFUNDED");
                    }
                    orderRepository.save(originalOrder);
                }
            } else if (req.getType() == ReturnRequestType.REPLACEMENT && status == ReturnRequestStatus.APPROVED) {
                // Create a replacement order automatically
                if (originalOrder != null) {
                    Order replacementOrder = Order.builder()
                        .user(originalOrder.getUser())
                        .shop(originalOrder.getShop())
                        .total(0.0) // Free replacement
                        .paymentProvider(originalOrder.getPaymentProvider())
                        .paymentStatus("SUCCESS") // Already paid
                        .orderStatus("CONFIRMED")
                        .address(originalOrder.getAddress())
                        .date(LocalDateTime.now())
                        .build();
                    orderRepository.save(replacementOrder);
                    originalOrder.setOrderStatus("REPLACEMENT_APPROVED");
                    orderRepository.save(originalOrder);
                }
            }
        }

        // Notify user of status change
        try {
            if (originalOrder != null && originalOrder.getUser() != null) {
                String typeStr = req.getType().name(); // RETURN or REPLACEMENT
                emailService.sendReturnRequestStatusEmail(
                    originalOrder.getUser().getEmail(),
                    originalOrder.getUser().getName(),
                    req.getOrderId().toString(),
                    typeStr.substring(0, 1) + typeStr.substring(1).toLowerCase(), // Return or Replacement
                    status.name(),
                    reason
                );

                // Real-time WebSocket refresh trigger
                notificationService.sendNotification(
                    originalOrder.getUser().getId(),
                    "Return Update",
                    "Your return/replacement request for Order #" + req.getOrderId() + " is now " + status.name().toLowerCase(),
                    "RETURN_UPDATE",
                    "{\"orderId\":" + req.getOrderId() + "}"
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to send status update notification: " + e.getMessage());
        }

        return saved;
    }
}
