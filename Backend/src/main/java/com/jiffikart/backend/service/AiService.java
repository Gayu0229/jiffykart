package com.jiffikart.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    public String generateContent(String prompt) {
        System.out.println("AI Service: Generating content for prompt...");
        
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(20000);    // 20 seconds
        RestTemplate restTemplate = new RestTemplate(factory);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Prepare the request body for Gemini API
        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> part = new HashMap<>();
        
        part.put("text", prompt);
        parts.add(part);
        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            String url = GEMINI_API_URL + "?key=" + apiKey;
            System.out.println("AI Service: Sending POST request to Gemini...");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                System.out.println("AI Service: Success response from Gemini.");
                // Parse the response to extract the generated text
                List candidates = (List) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map contentObj = (Map) candidate.get("content");
                    List partsList = (List) contentObj.get("parts");
                    if (partsList != null && !partsList.isEmpty()) {
                        Map firstPart = (Map) partsList.get(0);
                        return (String) firstPart.get("text");
                    }
                }
            } else {
                System.err.println("AI Service: Received non-OK status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("AI Service Error: " + e.getMessage());
            e.printStackTrace();
            return "Error generating AI response: " + e.getMessage();
        }
        
        System.err.println("AI Service: Failed to extract content from Gemini response.");
        return "Failed to generate AI content.";
    }

    public String generateProductDescription(String productName) {
        String prompt = "Act as an expert e-commerce copywriter. Generate a compelling, SEO-friendly product description for: " + productName + ". Keep it professional and highlighting key benefits.";
        return generateContent(prompt);
    }

    public String getPriceRecommendation(String productName, Double currentPrice) {
        String prompt = "Act as a market pricing analyst for an Indian e-grocery app. The product is '" + productName + "' currently priced at ₹" + currentPrice + ". Suggest a competitive price based on typical market trends (mid-range). Provide a recommended price and a brief 1-sentence reason.";
        return generateContent(prompt);
    }

    public String getReplySuggestion(String customerMessage) {
        String prompt = "Act as a helpful and polite customer support assistant for JiffyKart (an instant grocery delivery service). Suggest a polite response for a vendor to send to this customer query: \"" + customerMessage + "\". Keep it under 50 words.";
        return generateContent(prompt);
    }

    public String getSalesInsights(String salesSummaryData) {
        String prompt = "Analyze this weekly sales data for a vendor on JiffyKart: " + salesSummaryData + ". Provide exactly three bullet points: 1. Top selling category, 2. Peak sales time pattern, 3. One actionable growth tip.";
        return generateContent(prompt);
    }

    public String getInventoryAlerts(String inventoryData) {
        String prompt = "Analyze this inventory stock data: " + inventoryData + ". Identify which items are low on stock and provide a prioritize restocking list with estimated urgency (e.g., 'Within 2 days').";
        return generateContent(prompt);
    }
}
