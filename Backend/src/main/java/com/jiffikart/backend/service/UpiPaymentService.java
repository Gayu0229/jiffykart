package com.jiffikart.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class UpiPaymentService {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UpiPaymentService.class);

    @org.springframework.beans.factory.annotation.Value("${jiffikart.upi.id}")
    private String merchantUpiId;

    @org.springframework.beans.factory.annotation.Value("${jiffikart.upi.name:JiffyKart}")
    private String merchantName;

    @jakarta.annotation.PostConstruct
    public void init() {
        logger.info("UpiPaymentService initialized with Merchant UPI ID: {} and Name: {}", merchantUpiId, merchantName);
        if (merchantUpiId == null || merchantUpiId.trim().isEmpty()) {
            logger.error("MERCHANT UPI ID IS NULL OR EMPTY! Please check application.properties");
        }
    }

    public String generateUpiUrl(String orderId, Double amount) {
        String url = String.format("upi://pay?pa=%s&pn=%s&am=%.2f&cu=INR&tn=%s",
                merchantUpiId, merchantName, amount, orderId);
        logger.info("Generated UPI URL: {}", url);
        return url;
    }

    public String generateQrCodeBase64(String upiUrl) {
        try {
            logger.info("Generating QR code for URL: {}", upiUrl);
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(upiUrl, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            
            byte[] qrBytes = outputStream.toByteArray();
            String base64 = Base64.getEncoder().encodeToString(qrBytes);
            logger.info("QR code generated successfully. Base64 length: {}", base64.length());
            return base64;
        } catch (Exception e) {
            logger.error("Failed to generate QR code for URL: {}. Error: {}", upiUrl, e.getMessage(), e);
            throw new RuntimeException("Error generating QR code: " + e.getMessage(), e);
        }
    }
}
