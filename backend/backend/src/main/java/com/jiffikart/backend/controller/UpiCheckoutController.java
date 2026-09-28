package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.OrderRequest;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.OrderRepository;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.OrderService;
import com.jiffikart.backend.service.UpiPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customer/checkout/upi")
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class UpiCheckoutController {

    private final OrderService orderService;
    private final UpiPaymentService upiPaymentService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @PostMapping("/initiate")
    public ResponseEntity<?> initiateUpiPayment(@RequestBody OrderRequest request, Authentication authentication) {
        try {
            log.info("Initiating UPI Payment for Request: {}", request);
            String identifier = authentication.getName();
            User user = userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .or(() -> {
                        try {
                            return userRepository.findById(Long.parseLong(identifier));
                        } catch (Exception e) {
                            return java.util.Optional.empty();
                        }
                    })
                    .orElseThrow(() -> new RuntimeException("User not found: " + identifier));

            request.setUserId(user.getId());
            log.info("User identified: {} (ID: {})", user.getPhone(), user.getId());

            // 1. Create Order with UPI_QR provider
            String merchantTransactionId = "UPI" + UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 15);
            log.info("Generated MerchantTransactionId: {}", merchantTransactionId);
            
            Order order = orderService.createPrePaymentOrder(request, merchantTransactionId, "UPI_QR");
            log.info("Pre-payment order created. ID: {}, Total: {}", order.getId(), order.getTotal());

            // 2. Generate UPI URL and QR Code
            String upiUrl = upiPaymentService.generateUpiUrl(merchantTransactionId, order.getTotal());
            String qrBase64 = upiPaymentService.generateQrCodeBase64(upiUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.getId());
            response.put("merchantTransactionId", merchantTransactionId);
            response.put("amount", order.getTotal());
            response.put("upiUrl", upiUrl);
            response.put("qrCode", qrBase64);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to initiate UPI Payment. Error: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Internal Server Error: " + e.getMessage()));
        }
    }

    @PostMapping("/submit-txn")
    public ResponseEntity<?> submitTransactionId(@RequestBody Map<String, String> request) {
        String merchantTransactionId = request.get("merchantTransactionId");
        String transactionId = request.get("transactionId");

        if (merchantTransactionId == null || transactionId == null) {
            return ResponseEntity.badRequest().body("Missing merchantTransactionId or transactionId");
        }

        Order order = orderRepository.findByMerchantTransactionId(merchantTransactionId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Update with user submitted transaction ID
        // Set orderStatus to ORDER_RECEIVED so vendor can see and process the order
        // Keep paymentStatus as PENDING_VERIFICATION for admin to verify payment later
        order.setTransactionId(transactionId);
        order.setPaymentStatus("PENDING_VERIFICATION");
        order.setOrderStatus("ORDER_RECEIVED");
        order.setStatus("ORDER_RECEIVED");
        orderRepository.save(order);

        // Notify vendor about the new order via WebSocket
        try {
            orderService.notifyNewOrder(order);
        } catch (Exception e) {
            log.warn("Failed to send new order notification: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Transaction submitted. Your order is being processed."));
    }
}
