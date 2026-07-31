package com.jiffikart.backend.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class WhatsAppService {

    /**
     * MOCK WhatsApp Service
     * In a real app, this would integrate with Twilio or Meta WhatsApp API.
     */
    public void sendStockAlert(String phone, String productName, Integer currentStock) {
        String message = String.format(
            "JiffyKart Alert: Product '%s' is running low on stock (Only %d left). Please restock soon!",
            productName, currentStock
        );
        log.info("Sending WhatsApp Alert to {}: {}", phone, message);
        // Simulate external API call
        System.out.println("WHATSAPP ALERT [SENT]: " + message + " to " + phone);
    }
}
