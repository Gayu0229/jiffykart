package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.OrderRequest;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.OrderService;
import com.jiffikart.backend.service.PhonePeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/checkout/phonepe")
@RequiredArgsConstructor
public class CheckoutController {

    private final OrderService orderService;
    private final PhonePeService phonePeService;
    private final UserRepository userRepository;

    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(@RequestBody OrderRequest request, Authentication authentication) {
        String identifier = authentication.getName();
        User user = userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));

        request.setUserId(user.getId());

        // 1. Create Order with PENDING_PAYMENT status
        String merchantTransactionId = "TXN" + UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 18);
        Order order = orderService.createPrePaymentOrder(request, merchantTransactionId, "PHONEPE");

        // 2. Initiate PhonePe Payment
        Map<String, Object> response = phonePeService.initiatePayment(
                merchantTransactionId, 
                user.getId(), 
                order.getTotal()
        );

        return ResponseEntity.ok(response);
    }
}
