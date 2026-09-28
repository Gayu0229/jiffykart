package com.jiffikart.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiffikart.backend.config.PhonePeConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhonePeService {

    private final PhonePeConfig config;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    private String cachedToken = null;

    public String fetchAccessToken() {
        try {
            log.info("Fetching PhonePe token from: {}", config.getTokenUrl());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("X-CLIENT-ID", config.getClientId());
            headers.set("X-CLIENT-VERSION", config.getClientVersion());

            log.info("Safe Credential Debug - ClientID: {}, SecretLength: {}, Version: {}", 
                     config.getClientId(), 
                     (config.getClientSecret() != null ? config.getClientSecret().length() : 0),
                     config.getClientVersion());

            // Build URL-encoded body manually for absolute control
            String body = "grant_type=client_credentials" +
                          "&client_id=" + java.net.URLEncoder.encode(config.getClientId(), java.nio.charset.StandardCharsets.UTF_8) +
                          "&client_secret=" + java.net.URLEncoder.encode(config.getClientSecret(), java.nio.charset.StandardCharsets.UTF_8) +
                          "&client_version=" + java.net.URLEncoder.encode(config.getClientVersion(), java.nio.charset.StandardCharsets.UTF_8);

            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(config.getTokenUrl(), entity, Map.class);
            log.info("Token response status: {}", response.getStatusCode());
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String token = (String) response.getBody().get("access_token");
                if (token == null) {
                    log.error("Token missing in response: {}", response.getBody());
                    throw new RuntimeException("Bearer token missing in PhonePe response");
                }
                log.info("Successfully retrieved PhonePe token");
                return token;
            } else {
                log.error("Token fetch failed. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to fetch access token from PhonePe");
            }
        } catch (Exception e) {
            log.error("Critical error fetching PhonePe token: {}", e.getMessage());
            throw new RuntimeException("PhonePe Token Error: " + e.getMessage());
        }
    }

    public Map<String, Object> initiatePayment(String merchantTransactionId, Long userId, Double amount) {
        log.info("Initiating PhonePe payment for Txn: {}, User: {}, Amount: {}", merchantTransactionId, userId, amount);
        try {
            String token = fetchAccessToken();
            
            // Amount in paise
            long amountInPaise = Math.round(amount * 100);

            Map<String, Object> payload = new HashMap<>();
            payload.put("merchantId", config.getMerchantId());
            payload.put("merchantTransactionId", merchantTransactionId);
            payload.put("merchantUserId", "U" + userId);
            payload.put("amount", amountInPaise);
            payload.put("redirectUrl", config.getRedirectUrl() + "?id=" + merchantTransactionId);
            payload.put("redirectMode", "REDIRECT");
            payload.put("callbackUrl", config.getCallbackUrl());
            
            Map<String, Object> paymentInstrument = new HashMap<>();
            paymentInstrument.put("type", "PAY_PAGE");
            payload.put("paymentInstrument", paymentInstrument);

            String base64Payload = Base64.getEncoder().encodeToString(
                    objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8)
            );

            String xVerify = generateXVerify(base64Payload, "/pg-sandbox/checkout/v2/pay");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-VERIFY", xVerify);
            headers.set("Authorization", "O-Bearer " + token);
            headers.set("X-CLIENT-ID", config.getClientId()); // Added for completeness

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("request", base64Payload);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            log.info("Calling PhonePe API: {}", config.getApiUrl());
            ResponseEntity<Map> response = restTemplate.postForEntity(config.getApiUrl(), entity, Map.class);
            log.info("PhonePe initiation response status: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            } else {
                log.error("PhonePe initiation failed. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Payment initiation failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error initiating PhonePe payment", e);
            throw new RuntimeException("Error initiating payment: " + e.getMessage());
        }
    }

    public Map<String, Object> checkStatus(String merchantTransactionId) {
        try {
            // V2 Format: /checkout/v2/order/{merchantOrderId}/status
            String url = config.getStatusUrl() + "/" + merchantTransactionId + "/status";
            String endpoint = "/checkout/v2/order/" + merchantTransactionId + "/status";
            String xVerify = generateXVerifyForStatus(endpoint);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-VERIFY", xVerify);
            headers.set("X-MERCHANT-ID", config.getMerchantId());

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            } else {
                log.error("PhonePe status check failed for {}: {}", merchantTransactionId, response.getBody());
                return null;
            }
        } catch (Exception e) {
            log.error("Error checking PhonePe status", e);
            return null;
        }
    }

    public boolean verifyCallback(String xVerifyHeader, String responseBase64) {
        // Callback verification: SHA256(responseBase64 + saltKey) + ### + saltIndex
        try {
            String stringToHash = responseBase64 + config.getSaltKey();
            String sha256 = sha256(stringToHash);
            String calculatedXVerify = sha256 + "###" + config.getSaltIndex();
            return calculatedXVerify.equals(xVerifyHeader);
        } catch (Exception e) {
            log.error("Error verifying PhonePe callback", e);
            return false;
        }
    }

    private String generateXVerify(String base64Payload, String endpoint) {
        // Base64Encode(payload) + endpoint + SALT_KEY -> SHA256 -> append ###SALT_INDEX
        String stringToHash = base64Payload + endpoint + config.getSaltKey();
        return sha256(stringToHash) + "###" + config.getSaltIndex();
    }

    private String generateXVerifyForStatus(String endpoint) {
        // endpoint + SALT_KEY -> SHA256 -> append ###SALT_INDEX
        String stringToHash = endpoint + config.getSaltKey();
        return sha256(stringToHash) + "###" + config.getSaltIndex();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating SHA-256 hash", e);
        }
    }
}
