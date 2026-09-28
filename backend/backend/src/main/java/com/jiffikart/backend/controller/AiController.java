package com.jiffikart.backend.controller;

import com.jiffikart.backend.service.AiService;
import com.jiffikart.backend.service.OrderService;
import com.jiffikart.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/ai")
@PreAuthorize("hasRole('VENDOR')")
public class AiController {

    @Autowired
    private AiService aiService;

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @PostMapping("/product-description")
    public ResponseEntity<Map<String, String>> generateDescription(@RequestBody Map<String, String> request) {
        String productName = request.get("productName");
        String description = aiService.generateProductDescription(productName);
        Map<String, String> response = new HashMap<>();
        response.put("description", description);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/price-recommendation")
    public ResponseEntity<Map<String, String>> getPriceRecommendation(@RequestBody Map<String, Object> request) {
        String productName = (String) request.get("productName");
        Double currentPrice = Double.valueOf(request.get("currentPrice").toString());
        String recommendation = aiService.getPriceRecommendation(productName, currentPrice);
        Map<String, String> response = new HashMap<>();
        response.put("recommendation", recommendation);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reply-suggestion")
    public ResponseEntity<Map<String, String>> getReplySuggestion(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String suggestion = aiService.getReplySuggestion(message);
        Map<String, String> response = new HashMap<>();
        response.put("suggestion", suggestion);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sales-insights")
    public ResponseEntity<Map<String, String>> getSalesInsights() {
        // In a real app, we would fetch actual sales data for the current vendor
        // For now, we pass a simplified summary for the AI to analyze
        String mockSalesData = "Last 7 days: 150 orders total, ₹45,000 revenue. Top categories: Dairy & Eggs (40%), Snacks (25%). Highest traffic between 6PM and 10PM.";
        String insights = aiService.getSalesInsights(mockSalesData);
        Map<String, String> response = new HashMap<>();
        response.put("insights", insights);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/inventory-alerts")
    public ResponseEntity<Map<String, String>> getInventoryAlerts() {
        // Mock inventory data for analysis
        String mockInventoryData = "Amul Milk (15 units - Low), Oreo Biscuits (2 unit - Critical), Coca Cola (100 units - Good), Bread (5 units - Low).";
        String alerts = aiService.getInventoryAlerts(mockInventoryData);
        Map<String, String> response = new HashMap<>();
        response.put("alerts", alerts);
        return ResponseEntity.ok(response);
    }
}
