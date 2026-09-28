package com.jiffikart.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiffikart.backend.service.OrderService;
import com.jiffikart.backend.service.PhonePeService;
import com.jiffikart.backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/phonepe")
@RequiredArgsConstructor
@Slf4j
public class PaymentCallbackController {

    private final PhonePeService phonePeService;
    private final OrderService orderService;
    private final SubscriptionService subscriptionService;
    private final ObjectMapper objectMapper;

    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(
            @RequestHeader("X-VERIFY") String xVerify,
            @RequestBody Map<String, String> requestBody) {
        
        try {
            String responseBase64 = requestBody.get("response");
            
            // 1. Verify Checksum
            if (!phonePeService.verifyCallback(xVerify, responseBase64)) {
                log.error("PhonePe callback verification failed");
                return ResponseEntity.status(401).body("Invalid Checksum");
            }

            // 2. Decode Response
            String decodedResponse = new String(Base64.getDecoder().decode(responseBase64));
            Map<String, Object> responseMap = objectMapper.readValue(decodedResponse, Map.class);
            Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
            
            String merchantTransactionId = (String) data.get("merchantTransactionId");
            String transactionId = (String) data.get("transactionId");
            String code = (String) responseMap.get("code");

            log.info("Received PhonePe callback for txn: {}, status: {}", merchantTransactionId, code);

            // 3. Double Check with Status API (Security Rule: Do NOT trust redirect/callback alone)
            Map<String, Object> statusResponse = phonePeService.checkStatus(merchantTransactionId);
            
            if (statusResponse != null && "PAYMENT_SUCCESS".equals(statusResponse.get("code"))) {
                // Route subscription payments separately
                if (merchantTransactionId.startsWith("SUB-")) {
                    subscriptionService.activateSubscription(merchantTransactionId);
                } else {
                    orderService.markOrderAsPaid(merchantTransactionId, transactionId);
                }
                return ResponseEntity.ok("Success");
            } else {
                if (!merchantTransactionId.startsWith("SUB-")) {
                    orderService.markOrderAsFailed(merchantTransactionId);
                }
                return ResponseEntity.ok("Failed");
            }

        } catch (Exception e) {
            log.error("Error handling PhonePe callback", e);
            return ResponseEntity.status(500).body("Error");
        }
    }
}
