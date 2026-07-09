package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Invoice;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.OrderItem;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;
import com.jiffikart.backend.entity.Shop;
import java.io.InputStream;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

@Service
public class InvoiceService {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private EmailService emailService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Invoice generateAndSendInvoice(Order order) {
        String invoiceNumber = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + order.getId();
        
        Map<String, Object> templateData = prepareTemplateData(order, invoiceNumber);
        byte[] pdfContent = pdfService.generatePdfFromHtml("invoice", templateData);

        Invoice invoice = Invoice.builder()
                .id(UUID.randomUUID())
                .invoiceNumber(invoiceNumber)
                .order(order)
                .user(order.getUser())
                .fileBlob(pdfContent)
                .createdAt(LocalDateTime.now())
                .totalAmount(order.getTotal())
                .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return savedInvoice;
    }

    private Map<String, Object> prepareTemplateData(Order order, String invoiceNumber) {
        Map<String, Object> data = new HashMap<>();
        
        try {
            ClassPathResource imgFile = new ClassPathResource("logo.png");
            byte[] bytes = StreamUtils.copyToByteArray(imgFile.getInputStream());
            String base64Logo = Base64.getEncoder().encodeToString(bytes);
            data.put("companyLogo", "data:image/png;base64," + base64Logo);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        User user = order.getUser();
        Shop shop = order.getShop();
        
        data.put("invoiceNumber", invoiceNumber);
        data.put("customerName", user.getName());
        data.put("customerEmail", user.getEmail());
        data.put("customerPhone", user.getPhone());
        data.put("shopName", shop != null ? shop.getName() : "Jiffy Kart Store");
        data.put("shopLocation", shop != null ? shop.getAddress() : "Nagpur");
        data.put("shopPan", shop != null && shop.getPanNumber() != null ? shop.getPanNumber() : "NOT PROVIDED");
        data.put("shopGstin", shop != null && shop.getGstNumber() != null ? shop.getGstNumber() : "NOT PROVIDED");
        
        data.put("shopBankAcc", shop != null && shop.getBankAccountNumber() != null ? shop.getBankAccountNumber() : "N/A");
        data.put("shopIfsc", shop != null && shop.getIfscCode() != null ? shop.getIfscCode() : "N/A");
        data.put("shopAccHolder", shop != null && shop.getAccountHolderName() != null ? shop.getAccountHolderName() : "N/A");

        data.put("orderId", order.getId());
        data.put("orderDate", order.getCreatedAt() != null ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")) : "N/A");
        data.put("paymentMethod", order.getPaymentProvider() != null ? order.getPaymentProvider() : "Online Payment");
        
        List<Map<String, Object>> items = new ArrayList<>();
        double totalTaxableValue = 0.0;
        double totalIgstAmount = 0.0;
        double totalItemAmount = 0.0;
        
        int srNo = 1;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Map<String, Object> itemData = new HashMap<>();
                String name = (item.getProduct() != null) ? item.getProduct().getName() : "Unknown Product";
                String category = (item.getProduct() != null) ? item.getProduct().getCategory() : "Other";
                Double price = (item.getPriceAtOrder() != null) ? item.getPriceAtOrder() : ((item.getProduct() != null) ? item.getProduct().getPrice() : 0.0);
                Integer quantity = (item.getQuantity() != null) ? item.getQuantity() : 0;
                
                double gstRate = getGstRateForCategory(category);
                double igstPercent = gstRate * 100;
                
                double rowBaseTotal = price * quantity;
                double rowIgstAmount = Math.round(rowBaseTotal * gstRate);
                double rowTotal = rowBaseTotal + rowIgstAmount;

                itemData.put("srNo", srNo++);
                itemData.put("name", name);
                itemData.put("hsn", getHsnForCategory(category));
                itemData.put("quantity", quantity);
                itemData.put("rate", String.format("%.2f", price));
                itemData.put("taxableValue", String.format("%.2f", rowBaseTotal));
                itemData.put("igstPercent", String.format("%.1f", igstPercent));
                itemData.put("igstAmount", String.format("%.2f", rowIgstAmount));
                itemData.put("total", String.format("%.2f", rowTotal));
                
                items.add(itemData);
                
                totalTaxableValue += rowBaseTotal;
                totalIgstAmount += rowIgstAmount;
            }
        }
        
        // Add fees as line items
        double platformFee = 10.0;
        double deliveryFee = totalTaxableValue > 500 ? 0.0 : 40.0;
        
        if (platformFee > 0) {
            Map<String, Object> feeItem = new HashMap<>();
            double feeIgst = Math.round(platformFee * 0.18);
            feeItem.put("srNo", srNo++);
            feeItem.put("name", "Platform Fee");
            feeItem.put("hsn", "9973");
            feeItem.put("quantity", 1);
            feeItem.put("rate", String.format("%.2f", platformFee));
            feeItem.put("taxableValue", String.format("%.2f", platformFee));
            feeItem.put("igstPercent", "18.0");
            feeItem.put("igstAmount", String.format("%.2f", feeIgst));
            feeItem.put("total", String.format("%.2f", platformFee + feeIgst));
            items.add(feeItem);
            totalTaxableValue += platformFee;
            totalIgstAmount += feeIgst;
        }

        if (deliveryFee > 0) {
            Map<String, Object> feeItem = new HashMap<>();
            double feeIgst = Math.round(deliveryFee * 0.18);
            feeItem.put("srNo", srNo++);
            feeItem.put("name", "Delivery Fee");
            feeItem.put("hsn", "9968");
            feeItem.put("quantity", 1);
            feeItem.put("rate", String.format("%.2f", deliveryFee));
            feeItem.put("taxableValue", String.format("%.2f", deliveryFee));
            feeItem.put("igstPercent", "18.0");
            feeItem.put("igstAmount", String.format("%.2f", feeIgst));
            feeItem.put("total", String.format("%.2f", deliveryFee + feeIgst));
            items.add(feeItem);
            totalTaxableValue += deliveryFee;
            totalIgstAmount += feeIgst;
        }

        data.put("items", items);
        
        double finalTotal = totalTaxableValue + totalIgstAmount;
        
        data.put("totalTaxableValue", String.format("%.2f", totalTaxableValue));
        data.put("totalIgstAmount", String.format("%.2f", totalIgstAmount));
        data.put("totalAmount", String.format("%.2f", finalTotal));
        
        data.put("totalInWords", convertToIndianCurrency(Math.round(finalTotal)));
        
        data.put("deliveryDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")));
        
        return data;
    }

    private double getGstRateForCategory(String category) {
        if (category == null) return 0.18;
        switch (category) {
            case "Groceries": return 0.28;
            case "Electronics": return 0.28;
            case "Fashion": return 0.12;
            case "Home & Kitchen": return 0.28;
            case "Beauty & Health": return 0.18;
            case "Sports": return 0.28;
            case "Books": return 0.05;
            case "Toys": return 0.18;
            case "Auto Parts": return 0.28;
            case "Stationery": return 0.18;
            case "Pet Supplies": return 0.18;
            case "Food": return 0.28;
            default: return 0.18;
        }
    }

    private String getHsnForCategory(String category) {
        if (category == null) return "9999";
        switch (category) {
            case "Groceries": return "2106";
            case "Electronics": return "8543";
            case "Fashion": return "6117";
            case "Home & Kitchen": return "7323";
            case "Beauty & Health": return "3304";
            case "Sports": return "9506";
            case "Books": return "4901";
            case "Toys": return "9503";
            case "Auto Parts": return "8708";
            case "Stationery": return "4820";
            case "Pet Supplies": return "2309";
            case "Food": return "9963";
            default: return "9999";
        }
    }

    private String convertToIndianCurrency(long number) {
        if (number == 0) return "Zero Rupees Only";
        String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
        String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };
        
        if (number < 20) return units[(int) number] + " Rupees Only";
        
        StringBuilder words = new StringBuilder();
        if ((number / 10000000) > 0) {
            words.append(convertLessThanOneThousand((int)(number / 10000000))).append(" Crore ");
            number %= 10000000;
        }
        if ((number / 100000) > 0) {
            words.append(convertLessThanOneThousand((int)(number / 100000))).append(" Lakh ");
            number %= 100000;
        }
        if ((number / 1000) > 0) {
            words.append(convertLessThanOneThousand((int)(number / 1000))).append(" Thousand ");
            number %= 1000;
        }
        if (number > 0) words.append(convertLessThanOneThousand((int)number)).append(" ");
        return words.toString().trim() + " Rupees Only";
    }

        private String convertLessThanOneThousand(int number) {
            String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
            String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };
            String current;
            if (number % 100 < 20) {
                current = units[number % 100];
                number /= 100;
            } else {
                current = units[number % 10];
                number /= 10;
                current = tens[number % 10] + " " + current;
                number /= 10;
            }
            if (number == 0) return current.trim();
            return units[number] + " Hundred " + current.trim();
        }
    }
    
