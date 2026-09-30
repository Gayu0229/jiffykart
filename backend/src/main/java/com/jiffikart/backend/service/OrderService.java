package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.OrderRequest;
import com.jiffikart.backend.dto.OrderItemRequest;
import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.UUID;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;
import java.util.concurrent.CompletableFuture;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ShopRepository shopRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private EmailService emailService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private ProductService productService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private StatsService statsService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private ZohoBooksService zohoBooksService;

    @Transactional
    public Order placeOrder(OrderRequest request) {
        logger.info("Placing order for user: {}, shop: {}", request.getUserId(), request.getShopId());
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getUserId()));

        Long shopId = resolveShopId(request);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found: " + shopId));

        Order order = Order.builder()
                .user(user)
                .shop(shop)
                .date(LocalDateTime.now())
                .status("ORDER_RECEIVED")
                .orderStatus("ORDER_RECEIVED")
                .paymentProvider(request.getPaymentMethod() != null ? request.getPaymentMethod() : "COD")
                .paymentStatus("PENDING")
                .address(request.getAddress())
                .total(0.0)
                .build();
        
        final Order savedOrder = orderRepository.save(order);
        logger.info("Initial order saved with ID: {}", savedOrder.getId());

        List<OrderItem> items = new ArrayList<>();
        double itemTotal = 0;
        double gstTotal = 0;

        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId()).orElseThrow();
                // --- TIERED PRICING (Calculation Only, No Persistence) ---
                double effectivePrice = productService.getEffectivePrice(product, request.getZoneId());

                OrderItem item = OrderItem.builder()
                        .order(savedOrder)
                        .product(product)
                        .quantity(itemReq.getQuantity())
                        .priceAtOrder(effectivePrice)
                        .build();
                items.add(item);
                
                double lineTotal = effectivePrice * itemReq.getQuantity();
                itemTotal += lineTotal;
                double rate = getGstRateForCategory(product.getCategory());
                gstTotal += Math.round(lineTotal * rate);
            }
        }
        
        // --- FEE CALCULATION (Sync with Frontend) ---
        double platformFee = 10;
        double deliveryFee = itemTotal > 500 ? 0 : 40;
        double finalTotal = itemTotal + platformFee + gstTotal + deliveryFee;

        savedOrder.setTotal(finalTotal);
        savedOrder.setItems(items);
        
        Order finalOrder = orderRepository.save(savedOrder);
        logger.info("Order completion successful. ID: {}, Items: {}, Total: {}", finalOrder.getId(), items.size(), finalTotal);
        
        // Notify vendor via real-time WebSocket
        notificationService.sendNewOrderNotification(finalOrder);
        
        // Send email
        try {
            StringBuilder itemsList = new StringBuilder();
            for (OrderItem item : items) {
                if (itemsList.length() > 0) itemsList.append(", ");
                itemsList.append(item.getProduct().getName()).append(" (x").append(item.getQuantity()).append(")");
            }
            
            emailService.sendOrderConfirmationEmail(
                user.getEmail(), 
                user.getName(), 
                finalOrder.getId().toString(), 
                finalTotal, 
                itemsList.toString()
            );
        } catch (Exception e) {
            // Log but don't fail order
            System.err.println("Failed to trigger email: " + e.getMessage());
        }
        
        return finalOrder;
    }

    @Transactional
    public Order createPrePaymentOrder(OrderRequest request, String merchantTransactionId, String paymentProvider) {
        logger.info("Creating pre-payment order for user: {}, shop: {}, provider: {}", request.getUserId(), request.getShopId(), paymentProvider);
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getUserId()));

        Long shopId = resolveShopId(request);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found: " + shopId));

        Order order = Order.builder()
                .user(user)
                .shop(shop)
                .date(LocalDateTime.now())
                .paymentProvider(paymentProvider)
                .paymentStatus("PENDING")
                .orderStatus("ORDER_PLACED")
                .merchantTransactionId(merchantTransactionId)
                .address(request.getAddress())
                .total(0.0)
                .build();
        
        Order savedOrder = orderRepository.save(order);

        List<OrderItem> items = new ArrayList<>();
        double itemTotal = 0;
        double gstTotal = 0;

        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId()).orElseThrow();
                
                // --- TIERED PRICING (Calculation Only, No Persistence) ---
                double effectivePrice = productService.getEffectivePrice(product, request.getZoneId());

                OrderItem item = OrderItem.builder()
                        .order(savedOrder)
                        .product(product)
                        .quantity(itemReq.getQuantity())
                        .priceAtOrder(effectivePrice)
                        .build();
                items.add(item);
                
                double lineTotal = effectivePrice * itemReq.getQuantity();
                itemTotal += lineTotal;
                double rate = getGstRateForCategory(product.getCategory());
                gstTotal += Math.round(lineTotal * rate);
            }
        }
        
        // --- FEE CALCULATION (Sync with Frontend) ---
        double platformFee = 10;
        double deliveryFee = itemTotal > 500 ? 0 : 40;
        double finalTotal = itemTotal + platformFee + gstTotal + deliveryFee;

        savedOrder.setTotal(finalTotal);
        savedOrder.setItems(items);
        
        return orderRepository.save(savedOrder);
    }

    private Long resolveShopId(OrderRequest request) {
        Long shopId = request.getShopId();
        logger.info("Resolving shopId. Provided shopId in request: {}", shopId);
        
        if (shopId != null && shopId != 0) {
            return shopId;
        }

        // If shopId is null or 0, try to derive it from products
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            logger.info("Provided shopId was null/0. Attempting to derive from {} items.", request.getItems().size());
            for (OrderItemRequest itemReq : request.getItems()) {
                if (itemReq.getProductId() == null) continue;
                
                Product product = productRepository.findById(itemReq.getProductId()).orElse(null);
                if (product != null && product.getShop() != null) {
                    shopId = product.getShop().getId();
                    logger.info("Derived shopId {} from product ID: {}", shopId, itemReq.getProductId());
                    break;
                }
            }
        } else if (request.getItems() == null) {
            logger.warn("Items list in OrderRequest is NULL");
        } else {
            logger.warn("Items list in OrderRequest is EMPTY");
        }

        if (shopId == null || shopId == 0) {
            logger.info("Could not derive shopId from products. Attempting to fall back to an 'Official' shop.");
            shopId = shopRepository.findFirstByShopType("Official").map(Shop::getId).orElse(null);
            
            if (shopId == null) {
                logger.warn("No 'Official' shop found. Falling back to the first available shop in the database.");
                shopId = shopRepository.findAll().stream().findFirst().map(Shop::getId).orElse(null);
            }

            if (shopId != null) {
                logger.info("Successfully fell back to shop ID: {}", shopId);
            }
        }

        if (shopId == null || shopId == 0) {
            logger.error("Final check failed: shopId is {}", shopId);
            throw new RuntimeException("Shop ID is missing and could not be derived from products.");
        }
        return shopId;
    }

    @Transactional
    public void markOrderAsPaid(String merchantTransactionId, String transactionId) {
        Order order = orderRepository.findByMerchantTransactionId(merchantTransactionId)
                .orElseThrow(() -> new RuntimeException("Order not found for transaction: " + merchantTransactionId));
        
        order.setPaymentStatus("SUCCESS");
        order.setOrderStatus("ORDER_RECEIVED");
        order.setTransactionId(transactionId);
        order.setStatus("ORDER_RECEIVED"); // backward compatibility
        
        orderRepository.save(order);
        
        // Notify customer via WebSocket
        notificationService.notifyOrderStatusChange(order.getUser().getId(), order.getId(), "ORDER_RECEIVED");
        
        // Now trigger notifications and emails
        notificationService.sendNewOrderNotification(order);
        
        try {
            StringBuilder itemsList = new StringBuilder();
            for (OrderItem item : order.getItems()) {
                if (itemsList.length() > 0) itemsList.append(", ");
                itemsList.append(item.getProduct().getName()).append(" (x").append(item.getQuantity()).append(")");
            }
            
            emailService.sendOrderConfirmationEmail(
                order.getUser().getEmail(), 
                order.getUser().getName(), 
                order.getId().toString(), 
                order.getTotal(), 
                itemsList.toString()
            );
        } catch (Exception e) {
            logger.error("Failed to send confirmation email on payment success", e);
        }
    }

    @Transactional
    public void markOrderAsFailed(String merchantTransactionId) {
        Order order = orderRepository.findByMerchantTransactionId(merchantTransactionId)
                .orElseThrow(() -> new RuntimeException("Order not found for transaction: " + merchantTransactionId));
        
        order.setPaymentStatus("FAILED");
        order.setOrderStatus("CANCELLED");
        orderRepository.save(order);

        // Notify customer via WebSocket
        notificationService.notifyOrderStatusChange(order.getUser().getId(), order.getId(), "CANCELLED");
    }

    @Autowired
    private ReturnRequestRepository returnRequestRepository;

    public List<Order> getOrdersByUser(Long userId) {
        List<Order> orders = orderRepository.findByUser_Id(userId);
        orders.forEach(this::populateReturnRequest);
        return orders;
    }

    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        populateReturnRequest(order);
        return order;
    }

    private void populateReturnRequest(Order order) {
        List<ReturnRequest> returns = returnRequestRepository.findByOrderId(order.getId());
        if (!returns.isEmpty()) {
            order.setReturnRequest(returns.get(0)); // Usually only one active return/replace per order
        }
    }

    /**
     * Sends notifications for a new order (used by UPI checkout after txn submission).
     */
    public void notifyNewOrder(Order order) {
        // Notify vendor via real-time WebSocket
        notificationService.sendNewOrderNotification(order);

        // Notify customer via WebSocket about order status
        notificationService.notifyOrderStatusChange(order.getUser().getId(), order.getId(), "ORDER_RECEIVED");

        // Send confirmation email
        try {
            List<OrderItem> items = order.getItems();
            if (items != null && !items.isEmpty()) {
                StringBuilder itemsList = new StringBuilder();
                for (OrderItem item : items) {
                    if (itemsList.length() > 0) itemsList.append(", ");
                    itemsList.append(item.getProduct().getName()).append(" (x").append(item.getQuantity()).append(")");
                }
                emailService.sendOrderConfirmationEmail(
                    order.getUser().getEmail(),
                    order.getUser().getName(),
                    order.getId().toString(),
                    order.getTotal(),
                    itemsList.toString()
                );
            }
        } catch (Exception e) {
            logger.warn("Failed to send order confirmation email for UPI order: {}", e.getMessage());
        }
    }

    @Autowired
    private com.jiffikart.backend.validation.OrderStatusValidator orderStatusValidator;

    @Transactional
    public Order updateOrderStatus(Long orderId, String newStatus, Shop shop) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        orderStatusValidator.validateOwnership(order, shop);
        return finalizeStatusUpdate(order, newStatus);
    }

    @Transactional
    public Order adminUpdateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        return finalizeStatusUpdate(order, newStatus);
    }

    private Order finalizeStatusUpdate(Order order, String newStatus) {
        logger.info("finalizeStatusUpdate called for Order #{} with newStatus: '{}'", order.getId(), newStatus);
        orderStatusValidator.validateTransition(order.getOrderStatus(), newStatus.toUpperCase());

        order.setOrderStatus(newStatus.toUpperCase());
        order.setStatus(newStatus.toUpperCase());
        Order savedOrder = orderRepository.save(order);

        // Notify user about status change
        notificationService.notifyOrderStatusChange(
            order.getUser().getId(), 
            order.getId(), 
            newStatus.toUpperCase()
        );

        if ("DELIVERED".equalsIgnoreCase(newStatus)) {
            order.setDeliveredAt(LocalDateTime.now());
            if (order.getCreatedAt() != null) {
                long minutes = java.time.Duration.between(order.getCreatedAt(), order.getDeliveredAt()).toMinutes();
                order.setDeliveryTimeMinutes((int) minutes);
            }
            
            // Apply Cashback Benefits
            try {
                java.util.Map<String, Object> benefits = subscriptionService.getSubscriptionBenefits(order.getUser().getId());
                Double cashbackPercent = (Double) benefits.getOrDefault("cashbackPercent", 0.0);
                if (cashbackPercent > 0) {
                    double cashbackAmount = Math.floor(order.getTotal() * (cashbackPercent / 100.0));
                    if (cashbackAmount > 0) {
                        String planName = (String) benefits.getOrDefault("planName", "Plan");
                        walletService.addTransaction(
                            order.getUser().getId(),
                            cashbackAmount,
                            "credit",
                            "Cashback (" + cashbackPercent + "%) for Order #" + order.getId() + " via " + planName
                        );
                        logger.info("Credited ₹{} cashback to user {} for Order #{}", cashbackAmount, order.getUser().getId(), order.getId());
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to apply cashback for Order #{}", order.getId(), e);
            }

            
            // --- TRIGGER ZOHO BOOKS INVOICING (Asynchronous with delay) ---
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    System.out.println(">>> [DEBUG] WAITING TO SYNC ORDER #" + savedOrder.getId() + " TO ZOHO...");
                    Thread.sleep(2000); // Wait 2 seconds for DB to settle
                    System.out.println(">>> [DEBUG] STARTING ZOHO SYNC FOR ORDER #" + savedOrder.getId());
                    zohoBooksService.processOrderForZoho(savedOrder);
                    System.out.println(">>> [DEBUG] ZOHO SYNC COMPLETED FOR ORDER #" + savedOrder.getId());
                } catch (Exception e) {
                    System.out.println(">>> [DEBUG] ZOHO SYNC FAILED: " + e.getMessage());
                    e.printStackTrace();
                }
            });

            try {
                // Initialize lazy proxies...
                if (savedOrder.getItems() != null) {
                    savedOrder.getItems().size();
                    for (OrderItem item : savedOrder.getItems()) {
                        if (item.getProduct() != null) {
                            item.getProduct().getName();
                        }
                    }
                }
                if (savedOrder.getUser() != null) savedOrder.getUser().getName();
                if (savedOrder.getShop() != null) savedOrder.getShop().getName();

                logger.info("Initializing invoice generation for Order #{}", order.getId());
                Invoice savedInvoice = invoiceService.generateAndSendInvoice(savedOrder);
                
                final Long finalOrderId = order.getId();
                final UUID finalInvoiceId = savedInvoice.getId();
                
                logger.info("Registering transaction synchronization for Order #{}", finalOrderId);
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        logger.info("CRITICAL TRIGGER: Order transaction committed. Starting background processing for Order #{}", finalOrderId);
                        emailService.sendDeliverySuccessEmail(finalOrderId);
                        
                        // SYNC TO ZOHO AND THEN SEND INVOICE EMAIL
                        CompletableFuture.runAsync(() -> {
                            try {
                                Thread.sleep(3000); // 1. Initial wait for DB
                                Order freshOrder = orderRepository.findById(finalOrderId).orElse(null);
                                if (freshOrder != null) {
                                    System.out.println(">>> [ZOHO-SYNC] Step 1: Starting Zoho Creation for #" + finalOrderId);
                                    zohoBooksService.processOrderForZoho(freshOrder);
                                    
                                    Thread.sleep(2000); // 2. Wait for Zoho to finalize PDF generation
                                    freshOrder = orderRepository.findById(finalOrderId).orElse(null);
                                    
                                    if (freshOrder != null && freshOrder.getZohoInvoiceId() != null) {
                                        System.out.println(">>> [ZOHO-SYNC] Step 2: Downloading Zoho PDF for: " + freshOrder.getZohoInvoiceId());
                                        byte[] zohoPdf = zohoBooksService.downloadInvoicePdf(freshOrder.getZohoInvoiceId());
                                        
                                        if (zohoPdf != null && zohoPdf.length > 100) {
                                            System.out.println(">>> [ZOHO-SYNC] Step 3: Zoho PDF Downloaded (" + zohoPdf.length + " bytes). Saving to DB...");
                                            
                                            // Find the internal invoice and OVERWRITE the blob
                                            Invoice inv = invoiceRepository.findByOrderId(finalOrderId).orElse(null);
                                            if (inv != null) {
                                                inv.setFileBlob(zohoPdf);
                                                invoiceRepository.saveAndFlush(inv); // Force save immediately
                                                System.out.println(">>> [ZOHO-SYNC] Step 4: Internal Invoice record UPDATED with Zoho PDF.");
                                            } else {
                                                System.err.println(">>> [ZOHO-SYNC] ERROR: Could not find internal Invoice record for Order #" + finalOrderId);
                                            }
                                        } else {
                                            System.err.println(">>> [ZOHO-SYNC] ERROR: Zoho PDF download was empty or failed.");
                                        }
                                    } else {
                                        System.err.println(">>> [ZOHO-SYNC] ERROR: Zoho Invoice ID missing for Order #" + finalOrderId);
                                    }
                                    
                                    // 5. Finally send the invoice email
                                    Thread.sleep(1000); // Small breath before email
                                    System.out.println(">>> [ZOHO-SYNC] Final Step: Triggering Customer Email...");
                                    emailService.sendInvoiceEmail(finalOrderId, finalInvoiceId);
                                }
                            } catch (Exception e) {
                                logger.error("Background Zoho processing/email failed: {}", e.getMessage());
                            }
                        });
                    }
                    @Override public void suspend() { logger.debug("Sync Suspended for #{}", finalOrderId); }
                    @Override public void resume() { logger.debug("Sync Resumed for #{}", finalOrderId); }
                    @Override public void flush() { }
                    @Override public void beforeCommit(boolean readOnly) { logger.info("Sync beforeCommit for #{}", finalOrderId); }
                    @Override public void beforeCompletion() { }
                    @Override public void afterCompletion(int status) { 
                        logger.info("Sync afterCompletion for #{} with status: {}", finalOrderId, status); 
                    }
                });

            } catch (Exception e) {
                logger.error("CRITICAL: Failed to generate and send invoice for order: {}. Reason: {}", order.getId(), e.getMessage(), e);
            }
            
            // Trigger real-time stats update if status changed to DELIVERED
            statsService.updateAndBroadcast();
        }

        return savedOrder;
    }

    @Transactional
    public Order acceptOrder(Long orderId, Shop shop) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        orderStatusValidator.validateOwnership(order, shop);
        orderStatusValidator.validateTransition(order.getOrderStatus(), "ORDER_CONFIRMED");

        order.setOrderStatus("ORDER_CONFIRMED");
        order.setStatus("ORDER_CONFIRMED");
        Order savedOrder = orderRepository.save(order);

        try {
            emailService.sendOrderAcceptedEmail(
                order.getUser().getEmail(),
                order.getUser().getName(),
                order.getId().toString(),
                shop.getName()
            );
        } catch (Exception e) {
            logger.error("Failed to send order acceptance email", e);
        }

        // Notify customer via WebSocket
        notificationService.notifyOrderStatusChange(
            order.getUser().getId(),
            order.getId(),
            "ORDER_CONFIRMED"
        );

        return savedOrder;
    }

    @Transactional
    public Order rejectOrder(Long orderId, Shop shop) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        orderStatusValidator.validateOwnership(order, shop);
        orderStatusValidator.validateTransition(order.getOrderStatus(), "REJECTED");

        order.setOrderStatus("REJECTED");
        order.setStatus("REJECTED");
        Order savedOrder = orderRepository.save(order);

        // Notify customer via WebSocket
        notificationService.notifyOrderStatusChange(
            order.getUser().getId(),
            order.getId(),
            "REJECTED"
        );
        return savedOrder;
    }

    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        // Admins can cancel anytime, but we check transition for consistency
        orderStatusValidator.validateTransition(order.getOrderStatus(), "CANCELLED");
        
        order.setOrderStatus("CANCELLED");
        order.setStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);
        
        // Notify customer
        notificationService.notifyOrderStatusChange(order.getUser().getId(), order.getId(), "CANCELLED");
        
        return savedOrder;
    }

    public List<com.jiffikart.backend.dto.VendorCustomerDTO> getVendorCustomers(Shop shop) {
        return orderRepository.findVendorCustomers(shop.getId());
    }

    public double getGstRateForCategory(String category) {
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
}
