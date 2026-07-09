package com.jiffikart.backend.config;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;

@Component
public class DataInitializer implements CommandLineRunner {
        @Autowired
        private ShopRepository shopRepository;
        @Autowired
        private ProductRepository productRepository;
        @Autowired
        private BannerRepository bannerRepository;
        @Autowired
        private UserRepository userRepository;
        @Autowired
        private CategoryRepository categoryRepository;
        @Autowired
        private PasswordEncoder passwordEncoder;

        @Value("${admin.email}")
        private String adminEmail;

        @Value("${admin.password}")
        private String adminPassword;


        @Override
        public void run(String... args) {
                // String adminEmail = System.getenv("ADMIN_EMAIL") != null ? System.getenv("ADMIN_EMAIL") : "admin@jiffykart.org";
                // String adminPassword = System.getenv("ADMIN_PASSWORD");
                // if (adminPassword == null || adminPassword.isBlank()) {
                //         throw new IllegalStateException("ADMIN_PASSWORD environment variable is not set");
                // }

                // Seed admin user or update if exists
                userRepository.findByEmailIgnoreCase(adminEmail).ifPresentOrElse(admin -> {
                        admin.setPassword(passwordEncoder.encode(adminPassword));
                        admin.setEnabled(true);
                        admin.setEmailVerified(true);
                        admin.setRole(Role.ADMIN);
                        userRepository.save(admin);
                        System.out.println("✅ Admin user veri fied: " + adminEmail);
                }, () -> {
                        userRepository.findByPhone("0000000000").ifPresentOrElse(existingUser -> {
                                existingUser.setEmail(adminEmail);
                                existingUser.setPassword(passwordEncoder.encode(adminPassword));
                                existingUser.setRole(Role.ADMIN);
                                existingUser.setEnabled(true);
                                existingUser.setEmailVerified(true);
                                existingUser.setPhoneVerified(true);
                                userRepository.save(existingUser);
                                System.out.println("✅ Existing user updated to admin: " + adminEmail);
                        }, () -> {
                                User admin = User.builder()
                                                .name("JiffyKart Admin")
                                                .email(adminEmail)
                                                .phone("0000000000")
                                                .password(passwordEncoder.encode(adminPassword))
                                                .role(Role.ADMIN)
                                                .enabled(true)
                                                .emailVerified(true)
                                                .phoneVerified(true)
                                                .build();
                                userRepository.save(admin);
                                System.out.println("✅ Admin user seeded: " + adminEmail);
                        });
                });

                if (shopRepository.count() == 0) {
                        Shop s1 = Shop.builder()
                                        .name("Jiffy Mart")
                                        .rating(4.5)
                                        .ratingCount("1k+")
                                        .deliveryTime("15-20 min")
                                        .costForTwo("₹200")
                                        .image("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80")
                                        .location("HSR Layout")
                                        .city("Bangalore")
                                        .shopType("Official")
                                        .approvalStatus("APPROVED")
                                        .isActive(true)
                                        .kycStatus("VERIFIED")
                                        .tags(Arrays.asList("Groceries", "Fruits", "Vegetables"))
                                        .build();
                        shopRepository.save(s1);

                        Product p1 = Product.builder()
                                        .name("Fresh Bananas")
                                        .price(60.0)
                                        .originalPrice(80.0)
                                        .description("Premium quality fresh bananas.")
                                        .image("https://images.unsplash.com/photo-1571771894821-ad9902410947?auto=format&fit=crop&w=800&q=80")
                                        .category("Fruits")
                                        .rating(4.8)
                                        .votes(120)
                                        .isBestSeller(true)
                                        .shop(s1)
                                        .build();
                        productRepository.save(p1);

                        Product p2 = Product.builder()
                                        .name("Lays Classic")
                                        .price(20.0)
                                        .description("Classic salted potato chips.")
                                        .image("https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80")
                                        .category("Snacks")
                                        .rating(4.5)
                                        .votes(500)
                                        .shop(s1)
                                        .build();
                        productRepository.save(p2);
                } else {
                        // Hotfix: Ensure the seed shop "Jiffy Mart" (Official type) is APPROVED and active
                        shopRepository.findFirstByShopType("Official").ifPresent(officialShop -> {
                                boolean changed = false;
                                if (!"APPROVED".equalsIgnoreCase(officialShop.getApprovalStatus())) {
                                        officialShop.setApprovalStatus("APPROVED");
                                        changed = true;
                                }
                                if (!Boolean.TRUE.equals(officialShop.getIsActive())) {
                                        officialShop.setIsActive(true);
                                        changed = true;
                                }
                                if (!"VERIFIED".equalsIgnoreCase(officialShop.getKycStatus())) {
                                        officialShop.setKycStatus("VERIFIED");
                                        changed = true;
                                }
                                if (changed) {
                                        shopRepository.save(officialShop);
                                        System.out.println("✅ Hotfix: Official shop '" + officialShop.getName() + "' set to APPROVED + active");
                                }
                        });
                }

                if (bannerRepository.count() == 0) {
                        Banner b1 = Banner.builder()
                                        .title("Mega Sale")
                                        .subtitle("Up to 50% Off")
                                        .imageDesktopUrl("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80")
                                        .imageMobileUrl("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80")
                                        .ctaUrl("/category/Fruits")
                                        .position("Home")
                                        .isActive(true)
                                        .ctaText("Shop Now")
                                        .displayOrder(0)
                                        .build();
                        bannerRepository.save(b1);
                }

                // Seed Furniture category if not exists
                if (categoryRepository.findByName("Furniture").isEmpty()) {
                        Category furniture = Category.builder()
                                        .name("Furniture")
                                        .subCategories(Arrays.asList("Beds", "Sofas", "Tables", "Chairs", "Storage"))
                                        .isActive(true)
                                        .build();
                        categoryRepository.save(furniture);
                        System.out.println("✅ Furniture category seeded");
                }
        }
}
