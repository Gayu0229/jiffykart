package com.jiffikart.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SmsService {

    private static final Logger logger = LoggerFactory.getLogger(SmsService.class);

    @Value("${sms.gateway.url}")
    private String gatewayUrl;

    @Value("${sms.gateway.apikey}")
    private String apiKey;

    @Value("${sms.gateway.senderid}")
    private String senderId;

    @Value("${sms.gateway.message-template}")
    private String messageTemplate;

    @Value("${sms.gateway.templateid}")
    private String templateId;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendSms(String phone, String name, String otp) {
        try {
            String cleanedPhone = normalizePhoneNumber(phone);
            // Only allow letters in the name to match {#alp#} DLT placeholder constraint
            String cleanName = name != null ? name.replaceAll("[^a-zA-Z]", "") : "Customer";
            if (cleanName.isEmpty()) {
                cleanName = "Customer";
            }
            String messageText = String.format(messageTemplate, cleanName, otp);
            logger.info("Sending SMS OTP to phone: {} (normalized: {}) with message: {}", phone, cleanedPhone, messageText);

            // Construct URL dynamically to avoid issues with double encoding in UriComponentsBuilder
            // Target format: http://app.mydreamstechnology.in/vb/apikey.php?apikey=APIKEY&senderid=SENDERID&number=MOBILE&message=MESSAGE&templateid=TEMPLATEID
            String encodedMessage = URLEncoder.encode(messageText, StandardCharsets.UTF_8.toString());
            String finalUrl = String.format("%s?apikey=%s&senderid=%s&number=%s&message=%s&templateid=%s",
                    gatewayUrl, apiKey, senderId, cleanedPhone, encodedMessage, templateId);

            logger.info("SMS request URL: {}", finalUrl.replaceAll("apikey=[^&]+", "apikey=HIDDEN"));

            URI uri = new URI(finalUrl);
            String response = restTemplate.getForObject(uri, String.class);
            logger.info("SMS Gateway response: {}", response);

        } catch (Exception e) {
            logger.error("Failed to send SMS to: {}. Error: {}", phone, e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS OTP: " + e.getMessage());
        }
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) {
            return "";
        }
        // Remove all non-digit characters
        String cleaned = phone.replaceAll("[^0-9]", "");
        
        // Strip country code if present (e.g. 919876543210 -> 9876543210)
        if (cleaned.length() == 12 && cleaned.startsWith("91")) {
            return cleaned.substring(2);
        }
        
        return cleaned;
    }
}
