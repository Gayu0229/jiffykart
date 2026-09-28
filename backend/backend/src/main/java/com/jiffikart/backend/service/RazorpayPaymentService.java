package com.jiffikart.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RazorpayPaymentService {

    @Value("${razorpay.key.id:}")
    private String keyId;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    public RazorpayPaymentService(OrderRepository orderRepository,
                                  OrderService orderService,
                                  ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> createPaymentOrder(Long jiffyOrderId) {
        validateCredentials();

        Order order = orderRepository.findById(jiffyOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + jiffyOrderId));

        if (order.getTotal() == null || order.getTotal() <= 0) {
            throw new IllegalArgumentException("Invalid order amount");
        }

        long amountInPaise = BigDecimal.valueOf(order.getTotal())
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        Map<String, Object> notes = new LinkedHashMap<>();
        notes.put("jiffykart_order_id", String.valueOf(jiffyOrderId));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("amount", amountInPaise);
        requestBody.put("currency", "INR");
        requestBody.put("receipt", "JK-" + jiffyOrderId);
        requestBody.put("notes", notes);

        String responseBody = restClient.post()
                .uri("https://api.razorpay.com/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String razorpayOrderId = root.path("id").asText();
            if (razorpayOrderId == null || razorpayOrderId.isBlank()) {
                throw new IllegalStateException("Razorpay order id missing from response");
            }

            order.setPaymentProvider("RAZORPAY");
            order.setPaymentStatus("PENDING");
            order.setMerchantTransactionId(razorpayOrderId);
            orderRepository.save(order);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("key_id", keyId);
            result.put("razorpay_order_id", razorpayOrderId);
            result.put("jiffykart_order_id", jiffyOrderId);
            result.put("amount", amountInPaise);
            result.put("currency", "INR");
            result.put("name", "JiffyKart");
            result.put("description", "Payment for JiffyKart Order #" + jiffyOrderId);
            return result;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to parse Razorpay order response", e);
        }
    }

    public Map<String, Object> verifyPayment(Long jiffyOrderId,
                                              String razorpayOrderId,
                                              String razorpayPaymentId,
                                              String razorpaySignature) {
        validateCredentials();

        Order order = orderRepository.findById(jiffyOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + jiffyOrderId));

        String trustedOrderId = order.getMerchantTransactionId();
        if (trustedOrderId == null || !trustedOrderId.equals(razorpayOrderId)) {
            throw new IllegalArgumentException("Razorpay order id does not match this JiffyKart order");
        }

        String payload = trustedOrderId + "|" + razorpayPaymentId;
        String expectedSignature = hmacSha256(payload, keySecret);

        boolean valid = MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                razorpaySignature.getBytes(StandardCharsets.UTF_8));

        if (!valid) {
            order.setPaymentStatus("FAILED");
            orderRepository.save(order);
            throw new IllegalArgumentException("Invalid Razorpay payment signature");
        }

        orderService.markOrderAsPaid(trustedOrderId, razorpayPaymentId);

        return Map.of(
                "verified", true,
                "status", "SUCCESS",
                "order_id", jiffyOrderId,
                "razorpay_order_id", trustedOrderId,
                "razorpay_payment_id", razorpayPaymentId
        );
    }

    private String basicAuthHeader() {
        String raw = keyId + ":" + keySecret;
        return "Basic " + java.util.Base64.getEncoder()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to verify Razorpay signature", e);
        }
    }

    private void validateCredentials() {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException("Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
    }
}
