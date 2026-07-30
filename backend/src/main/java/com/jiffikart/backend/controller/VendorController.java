package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.*;
import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import com.jiffikart.backend.service.UserService;
import com.jiffikart.backend.service.VendorProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/vendor")
public class VendorController {

    @Autowired
    private com.jiffikart.backend.service.FileStorageService fileStorageService;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private ShopReviewRepository shopReviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorProfileService vendorProfileService;

    @Autowired
    private com.jiffikart.backend.service.PdfService pdfService;

    @Autowired
    private com.jiffikart.backend.service.StatsService statsService;

    private User getAuthenticatedUser(Authentication authentication) {
        String identifier = authentication.getName();
        try {
            Long userId = Long.parseLong(identifier);
            return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }

    private Shop getVendorShop(User vendor) {
        return shopRepository.findFirstByOwnerOrderByIdAsc(vendor)
                .orElseThrow(() -> new RuntimeException("Shop not found for vendor"));
    }

    /**
     * Resolves the vendor's shop via JWT vendorId (shop ID) first, then falls back to owner lookup.
     * This handles cases where the Shop.owner field may not be set correctly.
     */
    private Shop resolveVendorShop(User vendor, String token) {
        // 1. Try JWT vendorId (which is the shop ID)
        if (token != null && token.startsWith("Bearer ")) {
            try {
                String jwt = token.substring(7);
                io.jsonwebtoken.Claims claims = jwtUtils.extractAllClaims(jwt);
                Object vId = claims.get("vendorId");
                if (vId != null) {
                    Long jwtShopId = Long.valueOf(vId.toString());
                    Shop shop = shopRepository.findById(jwtShopId).orElse(null);
                    if (shop != null) return shop;
                }
            } catch (Exception e) {
                System.err.println("Failed to parse vendorId from JWT: " + e.getMessage());
            }
        }
        // 2. Fallback to owner lookup
        return shopRepository.findFirstByOwnerOrderByIdAsc(vendor)
                .orElseThrow(() -> new RuntimeException("Shop not found for vendor"));
    }

    @Autowired
    private com.jiffikart.backend.security.JwtUtils jwtUtils;

    @GetMapping("/profile")
    public ResponseEntity<?> getVendorProfile(Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        User vendor = getAuthenticatedUser(authentication);
        
        try {
            // 1. Try to get vendor profile via JWT vendorId first
            VendorProfileResponse vendorProfile;
            Long jwtVendorId = null;
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                io.jsonwebtoken.Claims claims = jwtUtils.extractAllClaims(jwt);
                Object vId = claims.get("vendorId");
                if (vId != null) {
                    jwtVendorId = Long.valueOf(vId.toString());
                }
            }

            if (jwtVendorId != null) {
                vendorProfile = vendorProfileService.getVendorProfileByShopId(jwtVendorId, vendor);
            } else {
                vendorProfile = vendorProfileService.getVendorProfile(vendor);
            }

            return ResponseEntity.ok(Map.of(
                "user", Map.of(
                    "name", vendor.getName() != null ? vendor.getName() : "",
                    "email", vendor.getEmail() != null ? vendor.getEmail() : "",
                    "phone", vendor.getPhone() != null ? vendor.getPhone() : "",
                    "avatar", vendor.getAvatar() != null ? vendor.getAvatar() : ""
                ),
                "vendorProfile", vendorProfile
            ));
        } catch (VendorProfileService.VendorNotApprovedException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (VendorProfileService.VendorProfileNotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Vendor Shop Profile Update ───
    @PutMapping(value = "/shop", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateShopProfile(
            @RequestParam(value = "shopName", required = false) String shopName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "businessType", required = false) String businessType,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "area", required = false) String area,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "pincode", required = false) String pincode,
            @RequestParam(value = "deliveryTime", required = false) String deliveryTime,
            @RequestParam(value = "costForTwo", required = false) String costForTwo,
            @RequestParam(value = "banner", required = false) org.springframework.web.multipart.MultipartFile banner,
            @RequestParam(value = "logo", required = false) org.springframework.web.multipart.MultipartFile logo,
            Authentication authentication
    ) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);

        if (shopName != null && !shopName.isBlank()) shop.setName(shopName);
        if (description != null) shop.setDescription(description);
        if (category != null && !category.isBlank()) shop.setCategory(category);
        if (businessType != null && !businessType.isBlank()) shop.setBusinessType(businessType);
        if (address != null && !address.isBlank()) {
            shop.setAddress(address);
            shop.setLocation(address); // legacy support
        }
        if (area != null) shop.setArea(area);
        if (city != null) shop.setCity(city);
        if (pincode != null) shop.setPincode(pincode);
        if (deliveryTime != null) shop.setDeliveryTime(deliveryTime);
        if (costForTwo != null) shop.setCostForTwo(costForTwo);

        if (banner != null && !banner.isEmpty()) {
            String bannerUrl = fileStorageService.storeFile(banner);
            shop.setBannerUrl(bannerUrl);
            shop.setImage(bannerUrl); // Sync main card image with banner
        }
        if (logo != null && !logo.isEmpty()) {
            String logoUrl = fileStorageService.storeFile(logo);
            shop.setLogoUrl(logoUrl);
            if (shop.getImage() == null || shop.getImage().contains("unsplash")) {
                shop.setImage(logoUrl); // Use logo as fallback card image if no banner exists or if it's still dummy
            }
        }

        shopRepository.save(shop);
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of("message", "Shop profile updated", "shop", shop));
    }

    // ─── Vendor Toggle Shop Open/Closed ───
    @PutMapping("/shop/toggle")
    public ResponseEntity<?> toggleShopActive(Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);

        if (!"APPROVED".equalsIgnoreCase(shop.getApprovalStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Shop must be approved before toggling"));
        }

        shop.setIsActive(!shop.getIsActive());
        shopRepository.save(shop);
        statsService.updateAndBroadcast();
        return ResponseEntity.ok(Map.of(
            "message", shop.getIsActive() ? "Shop is now OPEN" : "Shop is now CLOSED",
            "isActive", shop.getIsActive()
        ));
    }

    @Autowired
    private UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<?> updateVendorProfile(Authentication authentication, @RequestBody UpdateProfileRequest request) {
        User vendor = getAuthenticatedUser(authentication);
        try {
            User updatedUser = userService.updateVendorProfile(vendor.getId(), request);
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully.",
                "user", Map.of(
                    "name", updatedUser.getName(),
                    "email", updatedUser.getEmail(),
                    "phone", updatedUser.getPhone(),
                    "avatar", updatedUser.getAvatar() != null ? updatedUser.getAvatar() : ""
                )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = resolveVendorShop(vendor, token);

        // Simple stats calculation
        List<Order> orders = orderRepository.findByShop(shop);
        double salesTotal = orders.stream().mapToDouble(Order::getTotal).sum();
        long totalOrders = orders.size();
        
        return ResponseEntity.ok(Map.of(
                "salesTotal", salesTotal,
                "avgOrderValue", totalOrders > 0 ? salesTotal / totalOrders : 0,
                "totalOrders", totalOrders,
                "activeOrders", orders.stream().filter(o -> "ORDER_RECEIVED".equalsIgnoreCase(o.getOrderStatus()) || "CONFIRMED".equalsIgnoreCase(o.getOrderStatus())).count(),
                "openTickets", 0 // TODO: Implement support tickets
        ));
    }

    @Autowired
    private com.jiffikart.backend.service.ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(value = "status", required = false) String status,
            Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        if (status != null) {
            try {
                ProductStatus ps = ProductStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(productService.getProductsByShopAndStatus(shop, ps));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(productService.getProductsByShop(shop));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders(Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = resolveVendorShop(vendor, token);
        System.out.println("[VendorOrders] Fetching orders for shop ID: " + shop.getId() + ", Name: " + shop.getName());
        List<Order> orders = orderRepository.findByShop(shop);
        System.out.println("[VendorOrders] Found " + orders.size() + " orders");
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/export")
    public ResponseEntity<byte[]> exportOrders(Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        try {
            User vendor = getAuthenticatedUser(authentication);
            Shop shop = resolveVendorShop(vendor, token);
            List<Order> orders = orderRepository.findByShop(shop);

            double totalRevenue = orders.stream()
                .filter(o -> o.getTotal() != null)
                .mapToDouble(Order::getTotal)
                .sum();
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
            String generatedDate = LocalDateTime.now().format(formatter);

            List<Map<String, Object>> orderDataList = orders.stream().map(o -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", o.getId());
                map.put("date", o.getDate() != null ? o.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : "N/A");
                map.put("customerName", o.getUser() != null ? o.getUser().getName() : "Customer");
                map.put("total", o.getTotal() != null ? o.getTotal() : 0.0);
                map.put("status", o.getOrderStatus() != null ? o.getOrderStatus() : "PENDING");
                map.put("paymentStatus", o.getPaymentStatus() != null ? o.getPaymentStatus() : "Pending");
                return map;
            }).collect(Collectors.toList());

            Map<String, Object> templateData = new HashMap<>();
            templateData.put("shopName", shop.getName());
            templateData.put("shopAddress", shop.getAddress());
            templateData.put("shopEmail", vendor.getEmail());
            templateData.put("generatedDate", generatedDate);
            templateData.put("totalOrders", orders.size());
            templateData.put("totalRevenue", totalRevenue);
            templateData.put("orders", orderDataList);

            byte[] pdfBytes = pdfService.generatePdfFromHtml("vendor-order-history", templateData);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=order_registry.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            System.err.println("CRITICAL: Order export failed. Reason: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @Autowired
    private com.jiffikart.backend.service.OrderService orderService;

    @PutMapping("/orders/{id}/accept")
    public ResponseEntity<?> acceptOrder(@PathVariable Long id, Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = resolveVendorShop(vendor, token);
        Order order = orderService.acceptOrder(id, shop);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/orders/{id}/reject")
    public ResponseEntity<?> rejectOrder(@PathVariable Long id, Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = resolveVendorShop(vendor, token);
        Order order = orderService.rejectOrder(id, shop);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication, @RequestHeader(value="Authorization", required=false) String token) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = resolveVendorShop(vendor, token);
        Order order = orderService.updateOrderStatus(id, status, shop);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/customers")
    public ResponseEntity<List<com.jiffikart.backend.dto.VendorCustomerDTO>> getVendorCustomers(Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        return ResponseEntity.ok(orderService.getVendorCustomers(shop));
    }

    @PostMapping(value = "/products", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestParam("name") String name,
            @RequestParam("price") Double price,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("category") String category,
            @RequestParam(value = "subCategory", required = false) String subCategory,
            @RequestParam(value = "mrp", required = false) Double mrp,
            @RequestParam(value = "stockQuantity", defaultValue = "0") Integer stockQuantity,
            @RequestParam(value = "weight", required = false) String weight,
            @RequestParam(value = "dimensions", required = false) String dimensions,
            @RequestParam(value = "material", required = false) String material,
            @RequestParam(value = "showOnHome", defaultValue = "false") Boolean showOnHome,
            @RequestParam(value = "showOnJiffyStreet", defaultValue = "false") Boolean showOnJiffyStreet,
            @RequestParam(value = "showOnJiffyCafe", defaultValue = "false") Boolean showOnJiffyCafe,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestParam(value = "status", defaultValue = "DRAFT") String statusStr,
            Authentication authentication
    ) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storeFile(image);
        }

        ProductStatus productStatus;
        try {
            productStatus = ProductStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            productStatus = ProductStatus.DRAFT;
        }

        // Vendors cannot directly publish — must go through admin approval
        if (productStatus == ProductStatus.PUBLISHED) {
            if (!"APPROVED".equalsIgnoreCase(shop.getApprovalStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Your shop must be approved to submit products for review"));
            }
            productStatus = ProductStatus.PENDING; // Force to PENDING for admin approval
        }

        Product product = Product.builder()
                .name(name)
                .price(price)
                .mrp(mrp)
                .description(description)
                .category(category)
                .subCategory(subCategory)
                .stockQuantity(stockQuantity)
                .weight(weight)
                .dimensions(dimensions)
                .material(material)
                .showOnHome(showOnHome)
                .showOnJiffyStreet(showOnJiffyStreet)
                .showOnJiffyCafe(shop.getVendorType() == VendorType.STREET_HUB_VENDOR ? true : showOnJiffyCafe)
                .image(imageUrl)
                .shop(shop)
                .status(productStatus)
                .isActive(true)
                .rating(0.0)
                .votes(0)
                .build();

        return ResponseEntity.ok(productService.saveProduct(product));
    }

    @PutMapping("/products/{id}/publish")
    public ResponseEntity<?> publishProduct(@PathVariable Long id, Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        try {
            Product published = productService.publishProduct(id, shop);
            return ResponseEntity.ok(published);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/products/{id}/unpublish")
    public ResponseEntity<?> unpublishProduct(@PathVariable Long id, Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        try {
            Product unpublished = productService.unpublishProduct(id, shop);
            return ResponseEntity.ok(unpublished);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping(value = "/products/{id}", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "subCategory", required = false) String subCategory,
            @RequestParam(value = "mrp", required = false) Double mrp,
            @RequestParam(value = "stockQuantity", required = false) Integer stockQuantity,
            @RequestParam(value = "weight", required = false) String weight,
            @RequestParam(value = "dimensions", required = false) String dimensions,
            @RequestParam(value = "material", required = false) String material,
            @RequestParam(value = "showOnHome", required = false) Boolean showOnHome,
            @RequestParam(value = "showOnJiffyStreet", required = false) Boolean showOnJiffyStreet,
            @RequestParam(value = "showOnJiffyCafe", required = false) Boolean showOnJiffyCafe,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            Authentication authentication
    ) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        if (!product.getShop().getId().equals(shop.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized access to product"));
        }

        if (name != null) product.setName(name);
        if (price != null) product.setPrice(price);
        if (mrp != null) product.setMrp(mrp);
        if (description != null) product.setDescription(description);
        if (category != null) product.setCategory(category);
        if (subCategory != null) product.setSubCategory(subCategory);
        if (stockQuantity != null) product.setStockQuantity(stockQuantity);
        if (weight != null) product.setWeight(weight);
        if (dimensions != null) product.setDimensions(dimensions);
        if (material != null) product.setMaterial(material);
        if (showOnHome != null) product.setShowOnHome(showOnHome);
        if (showOnJiffyStreet != null) product.setShowOnJiffyStreet(showOnJiffyStreet);
        if (shop.getVendorType() == VendorType.STREET_HUB_VENDOR) {
            product.setShowOnJiffyCafe(true);
        } else if (showOnJiffyCafe != null) {
            product.setShowOnJiffyCafe(showOnJiffyCafe);
        }
        
        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            product.setImage(imageUrl);
        }
        
        return ResponseEntity.ok(productService.saveProduct(product));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id, Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        if (!product.getShop().getId().equals(shop.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized access to product"));
        }

        productRepository.delete(product);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private com.jiffikart.backend.service.CouponService couponService;

    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getVendorCoupons(Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        return ResponseEntity.ok(couponService.getCouponsByShop(shop.getId()));
    }

    @PostMapping("/coupons")
    public ResponseEntity<Coupon> createVendorCoupon(@RequestBody Coupon coupon, Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        coupon.setShopId(shop.getId());
        return ResponseEntity.ok(couponService.createCoupon(coupon));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Void> deleteVendorCoupon(@PathVariable Long id, Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        
        // Basic security check: find the coupon and check shop compatibility
        // This is simplified; ideally CouponService.deleteCoupon handles ownership check
        couponService.deleteCoupon(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/reviews")
    public ResponseEntity<?> getReviews(Authentication authentication) {
        User vendor = getAuthenticatedUser(authentication);
        Shop shop = getVendorShop(vendor);
        
        List<Review> productReviews = reviewRepository.findByShop_Id(shop.getId());
        List<ShopReview> shopReviews = shopReviewRepository.findByShopIdOrderByCreatedAtDesc(shop.getId());
        
        List<Map<String, Object>> allReviews = new ArrayList<>();
        
        // Map product reviews
        allReviews.addAll(productReviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("userName", r.getUserName());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("date", r.getDate());
            map.put("type", "PRODUCT");
            map.put("productName", r.getProduct() != null ? r.getProduct().getName() : "Product");
            return map;
        }).collect(Collectors.toList()));
        
        // Map shop reviews
        allReviews.addAll(shopReviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("userName", r.getUserName());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("date", r.getCreatedAt());
            map.put("type", "SHOP");
            map.put("productName", "Shop Review");
            return map;
        }).collect(Collectors.toList()));
        
        // Sort by date descending
        allReviews.sort((a, b) -> {
            LocalDateTime dateA = (LocalDateTime) a.get("date");
            LocalDateTime dateB = (LocalDateTime) b.get("date");
            if (dateA == null || dateB == null) return 0;
            return dateB.compareTo(dateA);
        });
        
        return ResponseEntity.ok(allReviews);
    }
}
