package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.service.EmailService;
import com.jiffikart.backend.service.InvoiceService;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/debug")
public class EmailDebugController {

    private static final Logger logger = LoggerFactory.getLogger(EmailDebugController.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam String to) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart Debug");
            helper.setTo(to);
            helper.setSubject("SMTP Test - Jiffy Kart");
            helper.setText("<h1>SMTP Test</h1><p>This is a synchronous test email from Jiffy Kart.</p>", true);

            mailSender.send(message);

            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Email sent successfully to " + to,
                "from", fromEmail
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "status", "FAILED",
                "error", e.getMessage(),
                "stackTrace", e.toString()
            ));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        return ResponseEntity.ok(emailLogRepository.findAll());
    }

    @GetMapping({"/test-delivery-sync", "/test_delivery_sync"})
    public ResponseEntity<?> testDeliverySync(@RequestParam Long orderId) {
        try {
            logger.info("Truly Synchronous Debug Test: Sending Delivery Email for Order #{}", orderId);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
            String recipientEmail = order.getUser().getEmail();

            helper.setFrom(fromEmail, "JiffyKaart Debug Sync");
            helper.setTo(recipientEmail);
            helper.setSubject("SYNC TEST: Your Order Has Been Delivered! - #" + order.getId());

            Context context = new Context();
            Map<String, Object> data = new HashMap<>();
            data.put("customerName", order.getUser().getName() != null ? order.getUser().getName() : "Customer");
            data.put("orderId", order.getId());
            data.put("shopName", (order.getShop() != null && order.getShop().getName() != null) ? order.getShop().getName() : "Jiffy Kart Store");
            data.put("totalAmount", order.getTotal() != null ? order.getTotal() : 0.0);
            data.put("deliveryDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariables(data);

            String htmlContent = templateEngine.process("delivery-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Synchronous delivery email sent to " + recipientEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "FAILED", "error", e.getMessage(), "stack", e.toString()));
        }
    }

    @GetMapping({"/test-invoice-sync", "/test_invoice_sync"})
    public ResponseEntity<?> testInvoiceSync(@RequestParam Long orderId, @RequestParam(required = false) UUID invoiceId) {
        try {
            logger.info("Truly Synchronous Debug Test: Sending Invoice Email for Order #{}", orderId);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
            Invoice invoice;
            if (invoiceId != null) {
                invoice = invoiceRepository.findById(invoiceId).orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));
            } else {
                List<Invoice> invoices = invoiceRepository.findAll().stream()
                        .filter(i -> i.getOrder().getId().equals(orderId))
                        .toList();
                if (invoices.isEmpty()) throw new RuntimeException("No invoice found for order " + orderId + ". Use /force-invoice-gen?orderId=" + orderId + " first.");
                invoice = invoices.get(invoices.size() -1);
            }

            String recipientEmail = order.getUser().getEmail();

            helper.setFrom(fromEmail, "JiffyKaart Debug Sync");
            helper.setTo(recipientEmail);
            helper.setSubject("SYNC TEST: Invoice for your Order #" + order.getId());

            Context context = new Context();
            Map<String, Object> data = new HashMap<>();
            data.put("customerName", order.getUser().getName() != null ? order.getUser().getName() : "Customer");
            data.put("orderId", order.getId());
            data.put("invoiceNumber", invoice.getInvoiceNumber());
            context.setVariables(data);

            String htmlContent = templateEngine.process("invoice-email", context);
            helper.setText(htmlContent, true);

            if (invoice.getFileBlob() != null) {
                ByteArrayDataSource dataSource = new ByteArrayDataSource(invoice.getFileBlob(), "application/pdf");
                helper.addAttachment("Invoice-" + invoice.getInvoiceNumber() + ".pdf", dataSource);
            }

            mailSender.send(message);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Synchronous invoice email sent to " + recipientEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "FAILED", "error", e.getMessage(), "stack", e.toString()));
        }
    }

    @GetMapping({"/force-invoice-gen", "/force_invoice_gen"})
    public ResponseEntity<?> forceInvoiceGen(@RequestParam Long orderId) {
        try {
            logger.info("Synchronous Debug Test: Forcing Invoice Generation for Order #{}", orderId);
            Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
            
            // Manually initialize proxies as done in OrderService
            if (order.getItems() != null) {
                order.getItems().size();
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) item.getProduct().getName();
                }
            }
            if (order.getUser() != null) order.getUser().getName();
            if (order.getShop() != null) order.getShop().getName();

            Invoice invoice = invoiceService.generateAndSendInvoice(order);

            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Invoice generated successfully",
                "invoiceId", invoice.getId(),
                "invoiceNumber", invoice.getInvoiceNumber()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "status", "FAILED",
                "error", e.getMessage(),
                "details", e.toString(),
                "hint", "This usually fails if PdfService or rendering has an issue."
            ));
        }
    }
}
