package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.entity.ProductStatus;
import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.repository.LocationProductDetailRepository;
import com.jiffikart.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    // --- Vendor methods ---

    public List<Product> getProductsByShop(Shop shop) {
        return productRepository.findByShop(shop);
    }

    public List<Product> getProductsByShopAndStatus(Shop shop, ProductStatus status) {
        return productRepository.findByShopAndStatus(shop, status);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    /**
     * Submit a product for admin approval. Validates that:
     * 1. Product belongs to the given shop
     * 2. All mandatory fields are filled
     * 3. Vendor shop is ACTIVE (approved)
     * Sets status to PENDING — admin must approve before it goes live.
     */
    @Transactional
    public Product publishProduct(Long productId, Shop shop) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getShop().getId().equals(shop.getId())) {
            throw new RuntimeException("Unauthorized: product does not belong to your shop");
        }

        // Validate vendor is approved
        if (!"APPROVED".equalsIgnoreCase(shop.getApprovalStatus())) {
            throw new RuntimeException("Shop status is '" + shop.getApprovalStatus() + "'. Your shop must be approved by an admin to publish products. Please check the Admin Dashboard.");
        }

        // Validate mandatory fields
        if (product.getName() == null || product.getName().isBlank()) {
            throw new RuntimeException("Product name is required to publish");
        }
        if (product.getPrice() == null || product.getPrice() <= 0) {
            throw new RuntimeException("Product price must be set to publish");
        }
        if (product.getCategory() == null || product.getCategory().isBlank()) {
            throw new RuntimeException("Product category is required to publish");
        }

        product.setStatus(ProductStatus.PENDING);
        return productRepository.save(product);
    }

    /**
     * Unpublish a product — sets status to UNPUBLISHED.
     */
    @Transactional
    public Product unpublishProduct(Long productId, Shop shop) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getShop().getId().equals(shop.getId())) {
            throw new RuntimeException("Unauthorized: product does not belong to your shop");
        }

        product.setStatus(ProductStatus.UNPUBLISHED);
        return productRepository.save(product);
    }

    // --- Public/Customer methods ---

    public List<Product> getPublishedProducts() {
        return productRepository.findPublishedProducts();
    }

    public List<Product> getPublishedProductsByCategory(String category) {
        return productRepository.findPublishedByCategory(category);
    }

    public List<Product> getPublishedForHome() {
        return productRepository.findPublishedForHome();
    }

    @Transactional(readOnly = true)
    public List<Product> getPublishedForJiffyStreet() {
        return productRepository.findPublishedForJiffyStreet();
    }

    @Transactional(readOnly = true)
    public List<Product> getPublishedForJiffyCafe() {
        return productRepository.findPublishedForJiffyCafe();
    }

    // Legacy compatibility
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getApprovedProducts() {
        return productRepository.findPublishedProducts();
    }

    public List<Product> getApprovedProductsByCategory(String category) {
        return productRepository.findPublishedByCategory(category);
    }

    @Autowired
    private LocationProductDetailRepository locationProductDetailRepository;

    @Autowired
    private com.jiffikart.backend.repository.CityRepository cityRepository;

    @Autowired
    private com.jiffikart.backend.repository.ZoneRepository zoneRepository;

    @Transactional(readOnly = true)
    public List<Product> getPublishedProductsByZone(UUID zoneId) {
        if (zoneId == null) return getPublishedProducts();
        
        com.jiffikart.backend.entity.Zone zone = zoneRepository.findById(zoneId)
                .orElse(null);
        
        if (zone == null) return getPublishedProducts();

        List<Product> products = productRepository.findPublishedByCity(zone.getCity().getName());
        
        products.forEach(p -> {
            p.setPrice(getEffectivePrice(p, zoneId));
            p.setMrp(getEffectiveMrp(p, zoneId));
        });
        
        return products;
    }

    public double getEffectivePrice(Product p, UUID zoneId) {
        com.jiffikart.backend.entity.Zone zone = (zoneId != null) ? zoneRepository.findById(zoneId).orElse(null) : null;
        String cityName = (zone != null) ? zone.getCity().getName() : null;
        
        double basePrice = p.getPrice();
        
        // 1. Apply City Overrides (if any)
        if (cityName != null) {
            var override = locationProductDetailRepository.findByProductIdAndCityId(p.getId(), 
                cityRepository.findByNameIgnoreCase(cityName).map(com.jiffikart.backend.entity.City::getId).orElse(null)
            );
            if (override.isPresent() && override.get().getPrice() != null) {
                basePrice = override.get().getPrice();
            }
        }
        
        // 2. Apply Tier Multiplier
        if (zone != null && zone.getTier() != null) {
            double multiplier = 1.0;
            switch (zone.getTier()) {
                case 1: multiplier = 1.10; break;
                case 2: multiplier = 1.05; break;
                case 3: multiplier = 1.03; break;
                default: break;
            }
            basePrice = Math.round(basePrice * multiplier);
        }
        
        return basePrice;
    }

    public double getEffectiveMrp(Product p, UUID zoneId) {
        com.jiffikart.backend.entity.Zone zone = (zoneId != null) ? zoneRepository.findById(zoneId).orElse(null) : null;
        String cityName = (zone != null) ? zone.getCity().getName() : null;
        
        double baseMrp = (p.getMrp() != null) ? p.getMrp() : p.getPrice();
        
        // 1. Apply City Overrides
        if (cityName != null) {
            var override = locationProductDetailRepository.findByProductIdAndCityId(p.getId(), 
                cityRepository.findByNameIgnoreCase(cityName).map(com.jiffikart.backend.entity.City::getId).orElse(null)
            );
            if (override.isPresent() && override.get().getMrp() != null) {
                baseMrp = override.get().getMrp();
            }
        }
        
        // 2. Apply Tier Multiplier
        if (zone != null && zone.getTier() != null) {
            double multiplier = 1.0;
            switch (zone.getTier()) {
                case 1: multiplier = 1.10; break;
                case 2: multiplier = 1.05; break;
                case 3: multiplier = 1.03; break;
                default: break;
            }
            baseMrp = Math.round(baseMrp * multiplier);
        }
        
        return baseMrp;
    }

    @Transactional(readOnly = true)
    public void applyTieredPricingByZoneId(Product p, UUID zoneId) {
        p.setPrice(getEffectivePrice(p, zoneId));
        p.setMrp(getEffectiveMrp(p, zoneId));
    }

    public List<Product> getPublishedProductsByCity(String cityName) {
        List<Product> products = productRepository.findPublishedByCity(cityName);
        products.forEach(p -> {
            locationProductDetailRepository.findByProductIdAndCityId(p.getId(), 
                cityRepository.findByNameIgnoreCase(cityName).map(com.jiffikart.backend.entity.City::getId).orElse(null)
            ).ifPresent(lpd -> {
                if (lpd.getPrice() != null) p.setPrice(lpd.getPrice());
                if (lpd.getMrp() != null) p.setMrp(lpd.getMrp());
            });
        });
        return products;
    }
}
