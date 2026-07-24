package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import com.jiffikart.backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.entity.Role;
import com.jiffikart.backend.entity.ProductStatus;
import com.jiffikart.backend.entity.Review;
import com.jiffikart.backend.entity.ShopReview;
import com.jiffikart.backend.entity.SubscriptionPlan;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ShopReviewRepository shopReviewRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private com.jiffikart.backend.service.ShopService shopService;

    @Autowired
    private com.jiffikart.backend.service.SellerApplicationService applicationService;

    @Autowired
    private com.jiffikart.backend.service.FileStorageService fileStorageService;

    @Autowired
    private com.jiffikart.backend.service.StatsService statsService;

    @Autowired
    private com.jiffikart.backend.service.EmailService emailService;
    
    @Autowired
    private com.jiffikart.backend.service.OrderService orderService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private ReturnService returnService;

    private User getCurrentUser() {
        String identifier = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return userRepository.findById(Long.parseLong(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (NumberFormatException e) {
            // Fallback for non-numeric identifiers (e.g. during dev/testing if principal is name)
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found with identifier: " + identifier));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getPlatformStats() {
        User user = getCurrentUser();
        
        long totalUsers;
        long totalShops;
        long totalOrders;
        long totalProducts;
        double totalGmv;

        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) {
            totalUsers = userRepository.count();
            totalShops = shopRepository.count();
            totalOrders = orderRepository.count();
            totalProducts = productRepository.count();
            totalGmv = orderRepository.findAll().stream().mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0).sum();
            
            return ResponseEntity.ok(Map.of(
                "users", totalUsers,
                "shops", totalShops,
                "orders", totalOrders,
                "products", totalProducts,
                "gmv", totalGmv,
                "customers", userRepository.countByRole(Role.CUSTOMER),
                "deliveryPartners", userRepository.countByRole(Role.DELIVERY_PARTNER)
            ));
        } else {
            // Field Manager stats (Location-aware)
            List<Shop> filteredShops = shopService.getShopsForUser(user);
            totalShops = filteredShops.size();
            totalUsers = filteredShops.stream().map(s -> s.getOwner().getId()).distinct().count();
            
            List<Long> shopIds = filteredShops.stream().map(Shop::getId).collect(java.util.stream.Collectors.toList());
            List<Order> orders = orderRepository.findByShop_IdIn(shopIds);
            
            totalOrders = orders.size();
            totalProducts = productRepository.findByShop_IdIn(shopIds).size();
            totalGmv = orders.stream().mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0).sum();
            
            return ResponseEntity.ok(Map.of(
                "users", totalUsers,
                "shops", totalShops,
                "orders", totalOrders,
                "products", totalProducts,
                "gmv", totalGmv
            ));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/customers")
    public ResponseEntity<?> getCustomers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.CUSTOMER));
    }

    @GetMapping("/delivery-partners")
    public ResponseEntity<?> getDeliveryPartners() {
        return ResponseEntity.ok(userRepository.findByRole(Role.DELIVERY_PARTNER));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getAllTransactions() {
        return ResponseEntity.ok(transactionRepository.findAll());
    }

    @GetMapping("/reviews")
    public ResponseEntity<?> getAllReviews() {
        List<Review> productReviews = reviewRepository.findAll();
        List<ShopReview> shopReviews = shopReviewRepository.findAll();
        
        // Map product reviews with names
        List<Map<String, Object>> mappedProductReviews = productReviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("userName", r.getUserName());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("date", r.getDate());
            map.put("title", r.getTitle());
            map.put("isVerified", r.getIsVerified());
            map.put("helpfulCount", r.getHelpfulCount());
            map.put("adminReply", r.getAdminReply());
            map.put("type", "PRODUCT");
            map.put("productName", r.getProduct() != null ? r.getProduct().getName() : "Unknown Product");
            map.put("shopName", r.getShop() != null ? r.getShop().getName() : "Unknown Shop");
            map.put("productImage", r.getProduct() != null ? r.getProduct().getImage() : null);
            map.put("isJiffyStreet", r.getProduct() != null && r.getProduct().getShowOnJiffyStreet() != null ? r.getProduct().getShowOnJiffyStreet() : false);
            map.put("isJiffyCafe", r.getProduct() != null && r.getProduct().getShowOnJiffyCafe() != null ? r.getProduct().getShowOnJiffyCafe() : false);
            map.put("images", r.getImages());
            map.put("videoUrl", r.getVideoUrl());
            return map;
        }).collect(Collectors.toList());

        // Map shop reviews with names
        List<Map<String, Object>> mappedShopReviews = shopReviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("userName", r.getUserName());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("createdAt", r.getCreatedAt());
            map.put("title", r.getTitle());
            map.put("isVerified", r.isVerified());
            map.put("adminReply", r.getAdminReply());
            map.put("type", "SHOP");
            
            Shop shop = shopRepository.findById(r.getShopId()).orElse(null);
            map.put("shopName", shop != null ? shop.getName() : "Shop #" + r.getShopId());
            map.put("shopLogo", shop != null ? shop.getLogoUrl() : null);
            map.put("images", r.getImages());
            map.put("videoUrl", r.getVideoUrl());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "productReviews", mappedProductReviews,
            "shopReviews", mappedShopReviews
        ));
    }

    @GetMapping("/shops")
    public ResponseEntity<?> getAllShops() {
        User user = getCurrentUser();
        List<Shop> shops = shopService.getShopsForUser(user);
        
        // Populate transient fields
        for (Shop shop : shops) {
            long liveCount = productRepository.countByShop_IdAndStatus(shop.getId(), ProductStatus.PUBLISHED);
            shop.setProductsLive(liveCount);
        }
        
        return ResponseEntity.ok(shops);
    }

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/public-debug-products")
    public List<Product> debugAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/products/pending")
    public ResponseEntity<?> getPendingProducts() {
        return ResponseEntity.ok(productRepository.findByStatus(ProductStatus.PENDING));
    }

    @PostMapping(value = "/products", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createAdminProduct(
            @RequestParam("name") String name,
            @RequestParam("price") Double price,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("category") String category,
            @RequestParam(value = "subCategory", required = false) String subCategory,
            @RequestParam(value = "mrp", required = false) Double mrp,
            @RequestParam(value = "stockQuantity", defaultValue = "0") Integer stockQuantity,
            @RequestParam(value = "showOnJiffyStreet", defaultValue = "false") String showOnJiffyStreetStr,
            @RequestParam(value = "showOnJiffyCafe", defaultValue = "false") String showOnJiffyCafeStr,
            @RequestParam(value = "showOnHome", defaultValue = "false") String showOnHomeStr,
            @RequestParam(value = "shopId", required = false) Long shopId,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestParam(value = "status", defaultValue = "PUBLISHED") String statusStr
    ) {
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storeFile(image);
        }

        ProductStatus productStatus;
        try {
            productStatus = ProductStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            productStatus = ProductStatus.PUBLISHED;
        }

        boolean showOnJiffyStreet = "true".equalsIgnoreCase(showOnJiffyStreetStr);
        boolean showOnJiffyCafe = "true".equalsIgnoreCase(showOnJiffyCafeStr);
        boolean showOnHome = "true".equalsIgnoreCase(showOnHomeStr);

        com.jiffikart.backend.entity.Shop shop = null;
        if (shopId != null) {
            shop = shopRepository.findById(shopId).orElse(null);
        } else {
            // Default to first 'Official' shop if no shopId provided by admin
            shop = shopRepository.findFirstByShopType("Official").orElse(null);
        }

        Product product = Product.builder()
                .name(name)
                .price(price)
                .mrp(mrp)
                .description(description)
                .category(category)
                .subCategory(subCategory)
                .stockQuantity(stockQuantity)
                .showOnHome(showOnHome)
                .showOnJiffyStreet(showOnJiffyStreet)
                .showOnJiffyCafe(showOnJiffyCafe)
                .image(imageUrl)
                .shop(shop)
                .status(productStatus)
                .isActive(true)
                .rating(0.0)
                .votes(0)
                .build();

        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (updates.containsKey("showOnJiffyStreet")) {
            Object val = updates.get("showOnJiffyStreet");
            if (val instanceof Boolean) product.setShowOnJiffyStreet((Boolean) val);
            else if (val instanceof String) product.setShowOnJiffyStreet("true".equalsIgnoreCase((String) val));
        }
        if (updates.containsKey("showOnJiffyCafe")) {
            Object val = updates.get("showOnJiffyCafe");
            if (val instanceof Boolean) product.setShowOnJiffyCafe((Boolean) val);
            else if (val instanceof String) product.setShowOnJiffyCafe("true".equalsIgnoreCase((String) val));
        }
        if (updates.containsKey("showOnHome")) {
            product.setShowOnHome((Boolean) updates.get("showOnHome"));
        }
        if (updates.containsKey("isActive")) {
            product.setIsActive((Boolean) updates.get("isActive"));
        }
        if (updates.containsKey("name")) {
            product.setName((String) updates.get("name"));
        }
        if (updates.containsKey("price")) {
            product.setPrice(Double.valueOf(updates.get("price").toString()));
        }
        if (updates.containsKey("status")) {
            try {
                product.setStatus(ProductStatus.valueOf(updates.get("status").toString().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // ignore invalid status
            }
        }

        if (updates.containsKey("mrp")) {
            product.setMrp(Double.valueOf(updates.get("mrp").toString()));
        }
        if (updates.containsKey("stockQuantity")) {
            product.setStockQuantity(Integer.valueOf(updates.get("stockQuantity").toString()));
        }

        productRepository.save(product);
        return ResponseEntity.ok(product);
    }

    @PostMapping("/products/{id}/approve")
    public ResponseEntity<?> approveProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setStatus(ProductStatus.PUBLISHED);
        productRepository.save(product);
        notificationService.notifyProductUpdate(id, "Your product '" + product.getName() + "' has been approved!");
        return ResponseEntity.ok(Map.of("message", "Product approved successfully"));
    }

    @PostMapping("/products/{id}/reject")
    public ResponseEntity<?> rejectProduct(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        String reason = payload != null ? payload.get("reason") : null;
        product.setStatus(ProductStatus.REJECTED);
        product.setRejectionReason(reason);
        productRepository.save(product);
        
        String notifyMsg = "Your product '" + product.getName() + "' was rejected.";
        if (reason != null && !reason.isBlank()) {
            notifyMsg += " Reason: " + reason;
        }
        notificationService.notifyProductUpdate(id, notifyMsg);
        
        return ResponseEntity.ok(Map.of("message", "Product rejected", "reason", reason != null ? reason : ""));
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return ResponseEntity.ok(order);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam(required = false) String status, @RequestBody(required = false) Map<String, String> body) {
        String newStatus = status;
        if (newStatus == null && body != null) {
            newStatus = body.get("status");
        }
        
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status is required"));
        }
        
        try {
            Order updatedOrder = orderService.adminUpdateOrderStatus(id, newStatus);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            Order cancelledOrder = orderService.cancelOrder(id);
            return ResponseEntity.ok(cancelledOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/orders/pending-upi")
    public ResponseEntity<?> getPendingUpiOrders() {
        return ResponseEntity.ok(orderRepository.findByPaymentStatus("PENDING_VERIFICATION"));
    }

    @PostMapping("/orders/{id}/verify-upi")
    public ResponseEntity<?> verifyUpiOrder(@PathVariable Long id, @RequestParam boolean approve) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        try {
            if (approve) {
                orderService.markOrderAsPaid(order.getMerchantTransactionId(), order.getTransactionId());
                return ResponseEntity.ok(Map.of("message", "Payment approved and order activated"));
            } else {
                orderService.markOrderAsFailed(order.getMerchantTransactionId());
                return ResponseEntity.ok(Map.of("message", "Payment rejected and order cancelled"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/shops/{id}")
    public ResponseEntity<?> deleteShop(@PathVariable Long id) {
        shopRepository.deleteById(id);
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of("message", "Shop deleted"));
    }

    @PutMapping("/shops/{id}")
    public ResponseEntity<?> updateShop(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found"));

        if (updates.containsKey("shopName")) {
            shop.setName((String) updates.get("shopName"));
        }
        if (updates.containsKey("phone")) {
            shop.setPhone((String) updates.get("phone"));
        }
        if (updates.containsKey("email")) {
            shop.setEmail((String) updates.get("email"));
        }
        if (updates.containsKey("status")) {
            String status = (String) updates.get("status");
            shop.setIsActive("Active".equalsIgnoreCase(status));
            if ("Blocked".equalsIgnoreCase(status)) {
                shop.setApprovalStatus("REJECTED");
                if (shop.getOwner() != null) {
                    shop.getOwner().setEnabled(false);
                    userRepository.save(shop.getOwner());
                    System.out.println("INSTANT LOGOUT DEBUG: Sending ACCOUNT_BLOCKED to user " + shop.getOwner().getId());
                    notificationService.sendNotification(shop.getOwner().getId(), "Account Blocked", "Your account has been blocked by admin.", "ACCOUNT_BLOCKED", "{\"shopId\":" + id + "}");
                }
            } else if ("Active".equalsIgnoreCase(status)) {
                shop.setApprovalStatus("APPROVED");
                if (shop.getOwner() != null) {
                    shop.getOwner().setEnabled(true);
                    userRepository.save(shop.getOwner());
                    notificationService.sendNotification(shop.getOwner().getId(), "Account Unblocked", "Your account has been unblocked by admin.", "ACCOUNT_UNBLOCKED", "{\"shopId\":" + id + "}");
                }
            }
        }
        if (updates.containsKey("ownerName") && shop.getOwner() != null) {
            shop.getOwner().setName((String) updates.get("ownerName"));
            userRepository.save(shop.getOwner());
        }

        shopRepository.save(shop);
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(shop);
    }

    // ─── Admin Shop Approval ───
    @PutMapping("/shop/{id}/approve")
    public ResponseEntity<?> approveShop(@PathVariable Long id) {
        com.jiffikart.backend.entity.Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        shop.setApprovalStatus("APPROVED");
        shop.setIsActive(true);
        shopRepository.save(shop);
        notificationService.notifyProductUpdate(null, "Your shop '" + shop.getName() + "' has been approved!");
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of("message", "Shop approved and set to active"));
    }

    @PutMapping("/shop/{id}/reject")
    public ResponseEntity<?> rejectShop(@PathVariable Long id, @RequestBody Map<String, String> body) {
        com.jiffikart.backend.entity.Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        shop.setApprovalStatus("REJECTED");
        shop.setIsActive(false);
        shopRepository.save(shop);
        String reason = body.getOrDefault("reason", "No reason provided");
        notificationService.notifyProductUpdate(null, "Your shop '" + shop.getName() + "' was rejected. Reason: " + reason);
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of("message", "Shop rejected"));
    }

    @GetMapping("/seller-applications")
    public ResponseEntity<?> getSellerApplications(@RequestParam(defaultValue = "PENDING") String status) {
        User user = getCurrentUser();
        return ResponseEntity.ok(applicationService.getApplicationsByStatusForUser(status, user));
    }

    @PostMapping("/seller-applications/{id}/approve")
    public ResponseEntity<?> approveSeller(@PathVariable Long id) {
        applicationService.approveApplication(id);
        return ResponseEntity.ok(Map.of("message", "Seller approved and shop initialized"));
    }

    @PostMapping("/seller-applications/{id}/reject")
    public ResponseEntity<?> rejectSeller(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "No reason provided");
        applicationService.rejectApplication(id, reason);
        return ResponseEntity.ok(Map.of("message", "Seller application rejected"));
    }

    @PatchMapping("/reviews/{id}/status")
    public ResponseEntity<?> updateReviewStatus(@PathVariable Long id, @RequestParam String status, @RequestParam(required = false) String type) {
        boolean isPublished = "PUBLISHED".equalsIgnoreCase(status);
        
        if ("PRODUCT".equalsIgnoreCase(type) || type == null) {
            Review review = reviewRepository.findById(id).orElse(null);
            if (review != null) {
                review.setIsVerified(isPublished);
                reviewRepository.save(review);
                return ResponseEntity.ok(Map.of("message", "Product review updated"));
            }
        }
        
        if ("SHOP".equalsIgnoreCase(type) || type == null) {
            ShopReview shopReview = shopReviewRepository.findById(id).orElse(null);
            if (shopReview != null) {
                shopReview.setVerified(isPublished);
                shopReviewRepository.save(shopReview);
                return ResponseEntity.ok(Map.of("message", "Shop review updated"));
            }
        }
        
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id, @RequestParam(required = false) String type) {
        if ("PRODUCT".equalsIgnoreCase(type) || type == null) {
            if (reviewRepository.existsById(id)) {
                reviewRepository.deleteById(id);
                return ResponseEntity.ok(Map.of("message", "Product review deleted"));
            }
        }
        if ("SHOP".equalsIgnoreCase(type) || type == null) {
            if (shopReviewRepository.existsById(id)) {
                shopReviewRepository.deleteById(id);
                return ResponseEntity.ok(Map.of("message", "Shop review deleted"));
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/reviews/{id}/reply")
    public ResponseEntity<?> replyToReview(@PathVariable Long id, @RequestBody Map<String, String> body, @RequestParam(required = false) String type) {
        String reply = body.get("reply");
        
        if ("PRODUCT".equalsIgnoreCase(type) || type == null) {
            Review review = reviewRepository.findById(id).orElse(null);
            if (review != null) {
                review.setAdminReply(reply);
                reviewRepository.save(review);
                return ResponseEntity.ok(Map.of("message", "Replied to product review"));
            }
        }
        
        if ("SHOP".equalsIgnoreCase(type) || type == null) {
            ShopReview shopReview = shopReviewRepository.findById(id).orElse(null);
            if (shopReview != null) {
                shopReview.setAdminReply(reply);
                shopReviewRepository.save(shopReview);
                return ResponseEntity.ok(Map.of("message", "Replied to shop review"));
            }
        }
        
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/shops/{id}/warning")
    public ResponseEntity<?> sendShopWarning(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        
        String message = body.getOrDefault("message", "No message provided");
        User owner = shop.getOwner();
        
        if (owner != null && owner.getEmail() != null) {
            emailService.sendWarningEmail(owner.getEmail(), owner.getName(), shop.getName(), message);
            notificationService.sendNotification(owner.getId(), "Shop Warning", message, "SHOP_WARNING", "{\"shopId\":" + id + "}");
            return ResponseEntity.ok(Map.of("message", "Warning sent successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Vendor email not found"));
        }
    }

    @PostMapping("/shops/{id}/block")
    public ResponseEntity<?> blockShop(@PathVariable Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        
        shop.setIsActive(false);
        shop.setApprovalStatus("REJECTED"); // Using REJECTED as a signal for blocked for now
        shopRepository.save(shop);
        
        User owner = shop.getOwner();
        if (owner != null) {
            owner.setEnabled(false);
            userRepository.save(owner);
        notificationService.sendNotification(owner.getId(), "Account Blocked", "Your account has been blocked by admin due to policy violations.", "ACCOUNT_BLOCKED", "{\"shopId\":" + id + "}");
        }
        
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of("message", "Shop and owner account blocked successfully"));
    }

    @PostMapping("/shops/{id}/unblock")
    public ResponseEntity<?> unblockShop(@PathVariable Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        
        shop.setIsActive(true);
        shop.setApprovalStatus("APPROVED");
        shopRepository.save(shop);
        
        User owner = shop.getOwner();
        if (owner != null) {
            owner.setEnabled(true);
            userRepository.save(owner);
        notificationService.sendNotification(owner.getId(), "Account Unblocked", "Your account has been unblocked by admin. You can now access your dashboard.", "ACCOUNT_UNBLOCKED", "{\"shopId\":" + id + "}");
        }
        
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of("message", "Shop and owner account unblocked successfully"));
    }
    // ═══════════════════════════════════════════
    // CATEGORIES
    // ═══════════════════════════════════════════

    @GetMapping("/categories")
    public ResponseEntity<?> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        Map<String, Long> counts = categoryService.getCategoryProductCounts();
        
        List<Map<String, Object>> response = categories.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("subCategories", c.getSubCategories());
            map.put("isActive", c.getIsActive());
            map.put("imageUrl", c.getImageUrl());
            map.put("productsCount", counts.getOrDefault(c.getName(), 0L));
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.saveCategory(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category categoryUpdates) {
        Category existing = categoryService.getCategoryById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        
        if (categoryUpdates.getName() != null) existing.setName(categoryUpdates.getName());
        if (categoryUpdates.getSubCategories() != null) existing.setSubCategories(categoryUpdates.getSubCategories());
        if (categoryUpdates.getIsActive() != null) existing.setIsActive(categoryUpdates.getIsActive());
        if (categoryUpdates.getImageUrl() != null) existing.setImageUrl(categoryUpdates.getImageUrl());
        
        return ResponseEntity.ok(categoryService.saveCategory(existing));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }

    // ═══════════════════════════════════════════
    // SUBSCRIPTION MANAGEMENT
    // ═══════════════════════════════════════════

    @GetMapping("/subscription/plans")
    public ResponseEntity<?> getSubscriptionPlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
    }

    @PostMapping("/subscription/plan")
    public ResponseEntity<?> createSubscriptionPlan(@RequestBody SubscriptionPlan plan) {
        return ResponseEntity.ok(subscriptionService.createPlan(plan));
    }

    @PutMapping("/subscription/plan/{id}")
    public ResponseEntity<?> updateSubscriptionPlan(@PathVariable Long id, @RequestBody SubscriptionPlan plan) {
        return ResponseEntity.ok(subscriptionService.updatePlan(id, plan));
    }

    @GetMapping("/subscription/users")
    public ResponseEntity<?> getSubscriptionUsers() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions().stream().map(sub -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", sub.getId());
            map.put("userName", sub.getUser().getName());
            map.put("userEmail", sub.getUser().getEmail());
            map.put("planName", sub.getPlan().getPlanName());
            map.put("price", sub.getPlan().getPrice());
            map.put("startDate", sub.getStartDate().toString());
            map.put("endDate", sub.getEndDate().toString());
            map.put("status", sub.getStatus().name());
            return map;
        }).collect(Collectors.toList()));
    }

    @GetMapping("/subscription/analytics")
    public ResponseEntity<?> getSubscriptionAnalytics() {
        return ResponseEntity.ok(subscriptionService.getAnalytics());
    }

    // --- Returns Monitoring ---
    @GetMapping("/returns")
    public ResponseEntity<?> getAllReturns() {
        return ResponseEntity.ok(returnService.getAllRequests());
    }

    @PutMapping("/returns/{id}/status")
    public ResponseEntity<?> adminUpdateReturnStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            ReturnRequestStatus status = ReturnRequestStatus.valueOf(body.get("status").toUpperCase());
            String reason = body.get("reason");
            ReturnRequest updated = returnService.updateStatus(id, status, reason);
            return ResponseEntity.ok(Map.of("message", "Status updated by admin", "data", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}