package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.OrderItem;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.OrderRepository;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ZohoBooksService {
    private static final Logger logger = LoggerFactory.getLogger(ZohoBooksService.class);

    @Value("${zoho.books.org.id}")
    private String orgId;

    @Autowired
    private ZohoTokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    private final String BASE_URL = "https://www.zohoapis.in/books/v3";

    /**
     * Entry point: Sync customer and create invoice for a delivered order.
     */
    public void processOrderForZoho(Order order) {
        try {
            System.out.println(">>> [ZOHO] STARTING SYNC FOR ORDER #" + order.getId());
            logger.info("Starting Zoho Books sync for Order #{}", order.getId());
            
            // 1. Sync Contact
            String contactId = syncContact(order.getUser());
            if (contactId == null) {
                logger.error("Could not sync contact to Zoho for user {}", order.getUser().getEmail());
                return;
            }

            // 2. Create Invoice
            createInvoice(order, contactId);
            
            logger.info("Successfully processed Zoho sync for Order #{}", order.getId());
        } catch (Exception e) {
            logger.error("Failed to process Zoho sync for Order #{}: {}", order.getId(), e.getMessage());
        }
    }

    private String syncContact(User user) {
        if (user.getZohoContactId() != null) {
            return user.getZohoContactId();
        }

        // Search for contact by email
        String contactId = searchContactByEmail(user.getEmail());
        if (contactId != null) {
            user.setZohoContactId(contactId);
            userRepository.save(user);
            return contactId;
        }

        // Create new contact
        return createContact(user);
    }

    private String searchContactByEmail(String email) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = getHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String url = BASE_URL + "/contacts?organization_id=" + orgId + "&email=" + email;
            logger.info("Zoho Contact Search URL: {}", url);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            logger.info("Zoho Contact Search Response: {}", response.getBody());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map> contacts = (List<Map>) response.getBody().get("contacts");
                if (contacts != null && !contacts.isEmpty()) {
                    return (String) contacts.get(0).get("contact_id");
                }
            }
        } catch (Exception e) {
            logger.warn("Error searching Zoho contact: {}", e.getMessage());
        }
        return null;
    }

    private String createContact(User user) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = getHeaders();

            Map<String, Object> body = new HashMap<>();
            Map<String, Object> contactData = new HashMap<>();
            contactData.put("contact_name", user.getName() != null ? user.getName() : "Customer " + user.getPhone());
            contactData.put("email", user.getEmail());
            contactData.put("phone", user.getPhone());
            contactData.put("company_name", "Individual");
            contactData.put("contact_type", "customer");
            
            body.putAll(contactData);

            HttpEntity<Map> entity = new HttpEntity<>(body, headers);
            String url = BASE_URL + "/contacts?organization_id=" + orgId;
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map contactMap = (Map) response.getBody().get("contact");
                String contactId = (String) contactMap.get("contact_id");
                user.setZohoContactId(contactId);
                userRepository.save(user);
                return contactId;
            }
        } catch (Exception e) {
            logger.error("Error creating Zoho contact: {}", e.getMessage());
        }
        return null;
    }

    private void createInvoice(Order order, String contactId) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = getHeaders();

            Map<String, Object> body = new HashMap<>();
            body.put("customer_id", contactId);
            body.put("reference_number", "JK-" + order.getId());
            
            List<Map<String, Object>> lineItems = order.getItems().stream().map(item -> {
                Map<String, Object> lineItem = new HashMap<>();
                lineItem.put("name", item.getProduct().getName());
                lineItem.put("rate", item.getPriceAtOrder());
                lineItem.put("quantity", item.getQuantity());
                return lineItem;
            }).collect(Collectors.toList());

            body.put("line_items", lineItems);
            body.put("reason", "Order from JiffyKart Website");
            body.put("status", "sent");
            body.put("date", java.time.LocalDate.now().toString()); // Explicitly add date

            HttpEntity<Map> entity = new HttpEntity<>(body, headers);
            // Removed &send=true to avoid Zoho trying to email it (which can fail and cause Draft status)
            String url = BASE_URL + "/invoices?organization_id=" + orgId;
            
            System.out.println(">>> [ZOHO] SENDING INVOICE TO ZOHO: " + body);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            System.out.println(">>> [ZOHO] RESPONSE CODE: " + response.getStatusCode());
            System.out.println(">>> [ZOHO] RESPONSE BODY: " + response.getBody());
            
            logger.info("Zoho Response Code: {}", response.getStatusCode());
            logger.info("Zoho Response Body: {}", response.getBody());

            if ((response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) && response.getBody() != null) {
                Map invoice = (Map) response.getBody().get("invoice");
                String invoiceId = (String) invoice.get("invoice_id");
                order.setZohoInvoiceId(invoiceId);
                orderRepository.save(order);
                logger.info("Zoho Invoice {} created for Order #{}", invoiceId, order.getId());

                // FORCE STATUS TO SENT VIA SEPARATE CALL
                try {
                    String statusUrl = BASE_URL + "/invoices/" + invoiceId + "/status/sent?organization_id=" + orgId;
                    restTemplate.postForEntity(statusUrl, new HttpEntity<>(headers), Map.class);
                    System.out.println(">>> [ZOHO] SUCCESSFULLY FORCED STATUS TO SENT FOR: " + invoiceId);
                } catch (Exception statusEx) {
                    System.err.println(">>> [ZOHO] FAILED TO FORCE STATUS: " + statusEx.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("Error creating Zoho invoice: {}", e.getMessage());
        }
    }

    /**
     * Download the official PDF from Zoho
     */
    public byte[] downloadInvoicePdf(String invoiceId) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = getHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_PDF));
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = BASE_URL + "/invoices/" + invoiceId + "?organization_id=" + orgId + "&accept=pdf";
            
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);
            return response.getBody();
        } catch (Exception e) {
            logger.error("Failed to download Zoho PDF for {}: {}", invoiceId, e.getMessage());
            return null;
        }
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokenService.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
