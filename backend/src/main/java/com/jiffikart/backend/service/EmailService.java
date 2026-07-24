package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.EmailLog;
import com.jiffikart.backend.entity.Invoice;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.repository.EmailLogRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import com.jiffikart.backend.repository.OrderRepository;
import com.jiffikart.backend.repository.InvoiceRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

@Service
public class EmailService{

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        logger.info("Triggering Welcome Email for: {} ({})", userName, toEmail);
        try {
            sendHtmlWelcomeEmail(toEmail, userName);
            logger.info("Successfully sent HTML Welcome Email to {}", toEmail);
        } catch (Exception e) {
            logger.warn("Failed to send HTML Welcome Email to {}, falling back to plain text. Error: {}", toEmail,
                    e.getMessage());
            sendPlainTextWelcomeEmail(toEmail, userName);
        }
    }

    public void sendPlainTextWelcomeEmail(String toEmail, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("JiffyKaart <" + fromEmail + ">");
        message.setTo(toEmail);
        message.setSubject("Welcome to Jiffy Kart!");
        message.setText("Dear " + userName
                + ",\n\nWelcome to Jiffy Kart! We are excited to have you on board.\n\nHappy Shopping!\nJiffy Kart Team");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send plain text email: " + e.getMessage());
        }
    }

    public void sendHtmlWelcomeEmail(String toEmail, String userName) throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, "JiffyKaart");
        helper.setTo(toEmail);
        helper.setSubject("Welcome to Jiffy Kart family!");

        String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>"
                +
                "<h1 style='color: #4CAF50; text-align: center;'>Welcome to Jiffy Kart!</h1>" +
                "<p>Hello <strong>" + userName + "</strong>,</p>" +
                "<p>Thank you for joining <strong>Jiffy Kart</strong>. We're thrilled to have you as part of our community!</p>"
                +
                "<p>At Jiffy Kart, we strive to bring you the best groceries and essentials delivered right to your doorstep in minutes.</p>"
                +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='http://localhost:3002' style='background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Start Shopping Now</a>"
                +
                "</div>" +
                "<p>If you have any questions, feel free to reply to this email.</p>" +
                "<p>Best regards,<br><strong>The Jiffy Kart Team</strong></p>" +
                "<hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>" +
                "<p style='font-size: 12px; color: #888; text-align: center;'>&copy; 2026 Jiffy Kart Inc. All rights reserved.</p>"
                +
                "</div>" +
                "</body>" +
                "</html>";

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("📧 Sending OTP to: " + toEmail);
        logger.info("Sending OTP Email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(toEmail);
            helper.setSubject("Your OTP - Jiffy Kart");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>"
                    +
                    "<h1 style='color: #4CAF50; text-align: center;'>Email Verification</h1>" +
                    "<p>Hello,</p>" +
                    "<p>Your One-Time Password (OTP) for Jiffy Kart is:</p>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "<span style='font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 10px; border: 1px dashed #4CAF50; padding: 10px 20px;'>"
                    + otp + "</span>" +
                    "</div>" +
                    "<p>This OTP is valid for <strong>5 minutes</strong>. For your security, please do not share this code with anyone.</p>"
                    +
                    "<p>If you did not request this OTP, please ignore this email.</p>" +
                    "<p>Best regards,<br><strong>The Jiffy Kart Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent OTP Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendVendorApprovalEmail(String toEmail, String shopName, String userName) {
        logger.info("Sending Vendor Approval Email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(toEmail);
            helper.setSubject("Congratulations! Your Jiffy Kart Seller Account is Approved");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                    "<h1 style='color: #4CAF50; text-align: center;'>Application Approved!</h1>" +
                    "<p>Hello <strong>" + userName + "</strong>,</p>" +
                    "<p>We are thrilled to inform you that your seller application for <strong>" + shopName + "</strong> has been approved!</p>" +
                    "<p>You can now access your vendor dashboard, manage your products, and start selling on Jiffy Kart.</p>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "<a href='http://localhost:3001' style='background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Go to Vendor Dashboard</a>" +
                    "</div>" +
                    "<p>Welcome to the Jiffy Kart Seller Community!</p>" +
                    "<p>Best regards,<br><strong>The Jiffy Kart Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Vendor Approval Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send vendor approval email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendVendorRejectionEmail(String toEmail, String shopName, String userName, String reason) {
        logger.info("Sending Vendor Rejection Email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(toEmail);
            helper.setSubject("Update on your Jiffy Kart Seller Application");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                    "<h1 style='color: #F44336; text-align: center;'>Application Status Update</h1>" +
                    "<p>Hello <strong>" + userName + "</strong>,</p>" +
                    "<p>Thank you for your interest in selling on Jiffy Kart. We have reviewed your application for <strong>" + shopName + "</strong>.</p>" +
                    "<p>Unfortunately, we are unable to approve your application at this time.</p>" +
                    "<div style='background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;'>" +
                    "<p style='margin: 0; font-weight: bold; color: #d32f2f;'>Reason for Rejection:</p>" +
                    "<p style='margin: 5px 0 0 0;'>" + reason + "</p>" +
                    "</div>" +
                    "<p>If you believe this is an error or if you have addressed the issues mentioned, you may re-apply or contact our support team.</p>" +
                    "<p>Best regards,<br><strong>The Jiffy Kart Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Vendor Rejection Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send vendor rejection email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWarningEmail(String toEmail, String userName, String shopName, String warningMessage) {
        logger.info("Sending Warning Email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(toEmail);
            helper.setSubject("Important: Warning for your shop " + shopName + " - Jiffy Kart");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                    "<h1 style='color: #FF9800; text-align: center;'>Performance Warning</h1>" +
                    "<p>Hello <strong>" + userName + "</strong>,</p>" +
                    "<p>This is a formal warning regarding your shop <strong>" + shopName + "</strong> on Jiffy Kart.</p>" +
                    "<div style='background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;'>" +
                    "<p style='margin: 0; font-weight: bold; color: #e65100;'>Message from Admin:</p>" +
                    "<p style='margin: 5px 0 0 0;'>" + warningMessage + "</p>" +
                    "</div>" +
                    "<p>Please address these concerns immediately to avoid potential suspension of your shop.</p>" +
                    "<p>If you have any questions, please contact the admin team.</p>" +
                    "<p>Best regards,<br><strong>The Jiffy Kart Admin Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Warning Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send warning email for shop {} to {}: {}", shopName, toEmail, e.getMessage());
        }
    }
    @Async
    public void sendOrderConfirmationEmail(String toEmail, String userName, String orderId, Double total, String items) {
        logger.info("Sending Order Confirmation Email to {} for Order #{}", toEmail, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(toEmail);
            helper.setSubject("Order Confirmed! - #" + orderId);

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                    "<div style='text-align: center; margin-bottom: 20px;'>" +
                    "<h1 style='color: #4CAF50; margin: 0;'>Order Successful!</h1>" +
                    "<p style='color: #888; margin: 5px 0;'>Thank you for shopping with Jiffy Kart</p>" +
                    "</div>" +
                    "<p>Hello <strong>" + userName + "</strong>,</p>" +
                    "<p>Your order <strong>#" + orderId + "</strong> has been placed successfully and is being processed by the store.</p>" +
                    "<div style='background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;'>" +
                    "<h3 style='margin-top: 0; color: #333;'>Order Summary</h3>" +
                    "<p style='margin: 5px 0;'><strong>Items:</strong> " + items + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Total Amount:</strong> ₹" + String.format("%.2f", total) + "</p>" +
                    "</div>" +
                    "<p>You can track your order status in the Jiffy Kart app.</p>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "<a href='http://localhost:3002/profile' style='background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>View Order History</a>" +
                    "</div>" +
                    "<p>Best regards,<br><strong>The Jiffy Kart Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Order Confirmation Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send order confirmation email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendOrderAcceptedEmail(String toEmail, String userName, String orderId, String shopName) {
        logger.info("Sending Order Accepted Email to {} for Order #{}", toEmail, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(toEmail);
            helper.setSubject("Your Order #" + orderId + " has been accepted!");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                    "<div style='text-align: center; margin-bottom: 20px;'>" +
                    "<h1 style='color: #4CAF50; margin: 0;'>Order Accepted!</h1>" +
                    "</div>" +
                    "<p>Hello <strong>" + userName + "</strong>,</p>" +
                    "<p>Good news! Your order <strong>#" + orderId + "</strong> has been accepted by <strong>" + shopName + "</strong> and is now being prepared.</p>" +
                    "<p>We'll notify you when it's out for delivery.</p>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "<a href='http://localhost:3002/tracking' style='background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Track Your Order</a>" +
                    "</div>" +
                    "<p>Thank you for choosing Jiffy Kart!</p>" +
                    "<p>Best regards,<br><strong>The Jiffy Kart Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Order Accepted Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send order accepted email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendDeliverySuccessEmail(Long orderId) {
        logger.info("Sending Delivery Success Email for Order #{}", orderId);
        try {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                logger.warn("Skipping Delivery Success Email: Order #{} not found", orderId);
                return;
            }
            if (order.getUser() == null || order.getUser().getEmail() == null) {
                logger.warn("Skipping Delivery Success Email: Missing user or email for Order #{}", orderId);
                return;
            }

            String recipientEmail = order.getUser().getEmail();
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(recipientEmail);
            helper.setSubject("Your Order Has Been Delivered! - #" + order.getId());

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
            saveEmailLog(order, recipientEmail, "USER", "SENT", null);
            logger.info("Successfully sent Delivery Success Email to {}", recipientEmail);
        } catch (Exception e) {
            logger.error("Failed to send delivery success email for Order #{}: {}", orderId, e.getMessage());
            try {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    saveEmailLog(order, (order.getUser() != null) ? order.getUser().getEmail() : "UNKNOWN", "USER", "FAILED", e.getMessage());
                }
            } catch (Exception logEx) {
                logger.error("Failed to save error email log for Order #{}: {}", orderId, logEx.getMessage());
            }
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendInvoiceEmail(Long orderId, UUID invoiceId) {
        logger.info("Sending Invoice Email for Order #{}", orderId);
        try {
            Order order = orderRepository.findById(orderId).orElse(null);
            Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);

            if (order == null) {
                logger.warn("Skipping Invoice Email: Order #{} not found", orderId);
                return;
            }
            if (invoice == null) {
                logger.warn("Skipping Invoice Email: Invoice #{} not found for Order #{}", invoiceId, orderId);
                return;
            }
            if (order.getUser() == null || order.getUser().getEmail() == null) {
                logger.warn("Skipping Invoice Email: Missing user or email for Order #{}", orderId);
                return;
            }

            String recipientEmail = order.getUser().getEmail();
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKaart");
            helper.setTo(recipientEmail);
            helper.setSubject("Invoice for your Order #" + order.getId());

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
            saveEmailLog(order, recipientEmail, "USER", "SENT", null);
            logger.info("Successfully sent Invoice Email for Order #{} to {}", orderId, recipientEmail);
        } catch (Exception e) {
            logger.error("Failed to send invoice email for Order #{}: {}", orderId, e.getMessage());
            try {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    saveEmailLog(order, (order.getUser() != null) ? order.getUser().getEmail() : "UNKNOWN", "USER", "FAILED", e.getMessage());
                }
            } catch (Exception logEx) {
                logger.error("Failed to save error email log for Order #{}: {}", orderId, logEx.getMessage());
            }
        }
    }

    @Async
    public void sendSupportTicketUpdateEmail(String toEmail, String userName, String ticketId, String subject, String resolution, String reason) {
        logger.info("Sending Support Ticket Update Email to {} for Ticket #{}", toEmail, ticketId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKart Support");
            helper.setTo(toEmail);
            helper.setSubject("Support Ticket Update – JiffyKart [#" + ticketId + "]");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                    "<h2 style='color: #2D3748;'>Support Ticket Update</h2>" +
                    "<p>Hello <strong>" + userName + "</strong>,</p>" +
                    "<p>Your support ticket has been reviewed and updated.</p>" +
                    "<div style='background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #edf2f7;'>" +
                    "<p style='margin: 0;'><strong>Ticket ID:</strong> " + ticketId + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Subject:</strong> " + subject + "</p>" +
                    "</div>" +
                    "<div style='margin: 20px 0;'>" +
                    "<h3 style='color: #4A5568; margin-bottom: 10px;'>Resolution:</h3>" +
                    "<p style='background-color: #f0fff4; border-left: 4px solid #48bb78; padding: 10px; margin: 0;'>" + resolution + "</p>" +
                    "</div>" +
                    "<div style='margin: 20px 0;'>" +
                    "<h3 style='color: #4A5568; margin-bottom: 10px;'>Reason:</h3>" +
                    "<p style='background-color: #ebf8ff; border-left: 4px solid #4299e1; padding: 10px; margin: 0;'>" + reason + "</p>" +
                    "</div>" +
                    "<p>If you still need help, reply to this email or open another ticket.</p>" +
                    "<p>Thank you,<br><strong>JiffyKart Support Team</strong></p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Support Ticket Update Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send support ticket update email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ─── Subscription Emails ───

    public void sendSubscriptionActivatedEmail(String toEmail, String userName, String planName, int validityDays) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("JiffyKart Subscription Activated ✅");

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px'>"
                    + "<div style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:16px;color:white;text-align:center'>"
                    + "<h1 style='margin:0 0 8px'>🎉 Subscription Activated!</h1>"
                    + "<p style='margin:0;opacity:0.9'>Welcome to " + planName + "</p></div>"
                    + "<div style='background:white;padding:32px;border-radius:16px;margin-top:16px'>"
                    + "<p>Hello <strong>" + userName + "</strong>,</p>"
                    + "<p>Your <strong>" + planName + "</strong> subscription has been activated successfully.</p>"
                    + "<p><strong>Plan Validity:</strong> " + validityDays + " Days</p>"
                    + "<p>Enjoy free delivery and exclusive deals!</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin-top:24px'>Thank you,<br>JiffyKart Team</p></div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Subscription activation email sent to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send subscription activation email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendSubscriptionExpiringEmail(String toEmail, String userName, String planName, int daysLeft) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("JiffyKart Subscription Expiring Soon ⏳");

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px'>"
                    + "<div style='background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;border-radius:16px;color:white;text-align:center'>"
                    + "<h1 style='margin:0 0 8px'>⏳ Subscription Expiring Soon</h1>"
                    + "<p style='margin:0;opacity:0.9'>" + daysLeft + " days remaining</p></div>"
                    + "<div style='background:white;padding:32px;border-radius:16px;margin-top:16px'>"
                    + "<p>Hello <strong>" + userName + "</strong>,</p>"
                    + "<p>Your <strong>" + planName + "</strong> subscription will expire in <strong>" + daysLeft + " days</strong>.</p>"
                    + "<p>Renew now to continue enjoying your benefits!</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin-top:24px'>Thank you,<br>JiffyKart Team</p></div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Subscription expiring email sent to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send subscription expiring email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendSubscriptionExpiredEmail(String toEmail, String userName, String planName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("JiffyKart Subscription Expired");

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px'>"
                    + "<div style='background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;border-radius:16px;color:white;text-align:center'>"
                    + "<h1 style='margin:0 0 8px'>Subscription Expired</h1>"
                    + "<p style='margin:0;opacity:0.9'>Your " + planName + " plan has ended</p></div>"
                    + "<div style='background:white;padding:32px;border-radius:16px;margin-top:16px'>"
                    + "<p>Hello <strong>" + userName + "</strong>,</p>"
                    + "<p>Your <strong>" + planName + "</strong> subscription has expired.</p>"
                    + "<p>You have been downgraded to the Free plan. Renew to get your benefits back!</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin-top:24px'>Thank you,<br>JiffyKart Team</p></div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Subscription expired email sent to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send subscription expired email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        logger.info("Sending basic email to {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("JiffyKaart <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Successfully sent basic email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send basic email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendReturnRequestStatusEmail(String toEmail, String userName, String orderId, String type, String status, String reason) {
        logger.info("Sending Premium Return Request Status Email to {} for Order #{}", toEmail, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "JiffyKart Support");
            helper.setTo(toEmail);
            helper.setSubject("Update: Your " + type + " Request for Order #" + orderId);

            String statusColor = "#6366f1"; // Default Indigo
            String statusIcon = "🔄";
            String decorativeIcon = "https://cdn-icons-png.flaticon.com/512/1041/1041888.png"; // Return icon
            
            if ("APPROVED".equalsIgnoreCase(status)) {
                statusColor = "#10b981"; // Emerald
                statusIcon = "✅";
                decorativeIcon = "https://cdn-icons-png.flaticon.com/512/4436/4436481.png"; // Success icon
            } else if ("REJECTED".equalsIgnoreCase(status)) {
                statusColor = "#f43f5e"; // Rose
                statusIcon = "❌";
                decorativeIcon = "https://cdn-icons-png.flaticon.com/512/564/564619.png"; // Alert icon
            } else if ("COMPLETED".equalsIgnoreCase(status)) {
                statusColor = "#8b5cf6"; // Violet
                statusIcon = "🎉";
                decorativeIcon = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; // Done icon
            }

            String htmlContent = "<!DOCTYPE html><html><body style='font-family: \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.08); border: 1px solid #f1f5f9;'>" +
                    "  <div style='background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); padding: 50px 40px; text-align: center; color: #ffffff;'>" +
                    "    <h1 style='margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);'>JiffyKart</h1>" +
                    "    <div style='display: inline-block; margin-top: 16px; padding: 6px 16px; background: rgba(255,255,255,0.15); border-radius: 100px; backdrop-filter: blur(4px);'>" +
                    "      <p style='margin: 0; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em;'>" + type + " REQUEST UPDATE</p>" +
                    "    </div>" +
                    "  </div>" +
                    "  <div style='padding: 50px 40px;'>" +
                    "    <h2 style='color: #0f172a; margin: 0 0 16px; font-size: 24px; font-weight: 700;'>Hi " + userName + ",</h2>" +
                    "    <p style='color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 35px;'>We've updated the status of your <strong>" + type.toLowerCase() + " request</strong> for Order <strong>#" + orderId + "</strong>.</p>" +
                    "    <div style='background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 24px; padding: 32px; text-align: center; margin-bottom: 35px;'>" +
                    "       <div style='font-size: 48px; margin-bottom: 16px;'>" + statusIcon + "</div>" +
                    "       <p style='color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 0.15em;'>Current Status</p>" +
                    "       <p style='color: " + statusColor + "; font-size: 28px; font-weight: 900; margin: 8px 0 0; text-transform: capitalize;'>" + status.toLowerCase() + "</p>" +
                    "    </div>";

            if (reason != null && !reason.isBlank()) {
                htmlContent += "    <div style='background-color: " + ("REJECTED".equalsIgnoreCase(status) ? "#fff1f2" : "#f0fdf4") + "; border-left: 5px solid " + statusColor + "; padding: 24px; border-radius: 16px; margin-bottom: 35px;'>" +
                        "      <p style='color: #0f172a; margin: 0 0 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;'>Reason from Team:</p>" +
                        "      <p style='color: " + ("REJECTED".equalsIgnoreCase(status) ? "#9f1239" : "#166534") + "; margin: 0; font-size: 16px; font-weight: 600; font-style: italic; line-height: 1.5;'>\"" + reason + "\"</p>" +
                        "    </div>";
            }

            htmlContent += "    <p style='color: #475569; font-size: 14px; margin-bottom: 35px; line-height: 1.6;'>You can track every milestone of your request 🛰️ directly through our real-time tracker.</p>" +
                    "    <div style='text-align: center;'>" +
                    "      <a href='http://localhost:3002/tracking?orderId=" + orderId + "' style='display: inline-block; background-color: #0f172a; color: #ffffff; padding: 18px 40px; border-radius: 16px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 25px rgba(15,23,42,0.15); transition: all 0.3s ease;'>Track Return Status</a>" +
                    "    </div>" +
                    "  </div>" +
                    "  <div style='background-color: #f8fafc; padding: 40px; border-top: 1px solid #f1f5f9; text-align: center;'>" +
                    "    <p style='color: #94a3b8; font-size: 12px; margin: 0;'>&copy; 2026 JiffyKart. All rights reserved.</p>" +
                    "    <p style='color: #cbd5e1; font-size: 11px; margin: 6px 0 0;'>This is an automated notification. If you have any questions, please contact our support team.</p>" +
                    "  </div>" +
                    "</div></body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Successfully sent Premium Return Request Status Email to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send premium return request status email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void saveEmailLog(Order order, String recipient, String type, String status, String error) {
        try {
            EmailLog log = EmailLog.builder()
                    .order(order)
                    .recipient(recipient)
                    .type(type)
                    .status(status)
                    .retryCount(0)
                    .errorMessage(error)
                    .createdAt(LocalDateTime.now())
                    .build();
            emailLogRepository.save(log);
        } catch (Exception e) {
            logger.error("Failed to save email log", e);
        }
    }
}

