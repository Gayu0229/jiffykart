package com.jiffikart.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import java.util.HashMap;

@Service
public class ZohoTokenService {
    private static final Logger logger = LoggerFactory.getLogger(ZohoTokenService.class);

    @Value("${zoho.books.client.id}")
    private String clientId;

    @Value("${zoho.books.client.secret}")
    private String clientSecret;

    @Value("${zoho.books.refresh.token:}")
    private String refreshToken;

    private String accessToken;
    private long expiryTime;

    public String getAccessToken() {
        if (accessToken != null && System.currentTimeMillis() < expiryTime) {
            return accessToken;
        }
        return refreshAccessToken();
    }

    public synchronized String refreshAccessToken() {
        if (refreshToken == null || refreshToken.isEmpty()) {
            logger.error("Zoho Refresh Token is missing! Please provide a refresh token in application.properties");
            throw new RuntimeException("Zoho Refresh Token is missing");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://accounts.zoho.in/oauth/v2/token";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String body = String.format("refresh_token=%s&client_id=%s&client_secret=%s&grant_type=refresh_token",
                    refreshToken, clientId, clientSecret);

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                accessToken = (String) response.getBody().get("access_token");
                Integer expiresIn = (Integer) response.getBody().get("expires_in");
                expiryTime = System.currentTimeMillis() + (expiresIn * 1000) - 60000; // Buffer of 1 minute
                logger.info("Zoho Access Token refreshed successfully. Expires in {} seconds", expiresIn);
                return accessToken;
            } else {
                throw new RuntimeException("Failed to refresh Zoho token: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error refreshing Zoho access token: {}", e.getMessage());
            throw new RuntimeException("Zoho Token Refresh Error", e);
        }
    }

    /**
     * Helper method to exchange the one-time code for a permanent refresh token.
     */
    public Map<String, String> exchangeCodeForTokens(String code) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://accounts.zoho.in/oauth/v2/token";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String body = String.format("code=%s&client_id=%s&client_secret=%s&grant_type=authorization_code",
                    code, clientId, clientSecret);

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, String> tokens = new HashMap<>();
                tokens.put("access_token", (String) response.getBody().get("access_token"));
                tokens.put("refresh_token", (String) response.getBody().get("refresh_token"));
                return tokens;
            } else {
                throw new RuntimeException("Failed to exchange Zoho code: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error exchanging Zoho code for tokens: {}", e.getMessage());
            throw new RuntimeException("Zoho Code Exchange Error", e);
        }
    }
}
