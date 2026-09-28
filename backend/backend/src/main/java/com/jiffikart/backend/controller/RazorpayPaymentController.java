package com.jiffikart.backend.controller;

import com.jiffikart.backend.service.RazorpayPaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/razorpay/payment")
public class RazorpayPaymentController {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayPaymentController.class);
    private final RazorpayPaymentService razorpayPaymentService;

    public RazorpayPaymentController(RazorpayPaymentService razorpayPaymentService) {
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @PostMapping("/initiate/{orderId}")
    public ResponseEntity<?> initiate(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(razorpayPaymentService.createPaymentOrder(orderId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Razorpay initiation failed for order #{}", orderId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> body) {
        try {
            Long jiffyOrderId = Long.valueOf(String.valueOf(body.get("jiffykart_order_id")));
            String razorpayOrderId = required(body, "razorpay_order_id");
            String razorpayPaymentId = required(body, "razorpay_payment_id");
            String razorpaySignature = required(body, "razorpay_signature");

            return ResponseEntity.ok(razorpayPaymentService.verifyPayment(
                    jiffyOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Razorpay verification failed", e);
            return ResponseEntity.internalServerError().body(Map.of("verified", false, "error", e.getMessage()));
        }
    }

    private String required(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException(key + " is required");
        }
        return String.valueOf(value);
    }
}
