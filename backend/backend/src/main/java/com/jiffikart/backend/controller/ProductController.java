package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customer/products")
public class ProductController {
    @Autowired
    private ProductService productService;

    /**
     * Returns only PUBLISHED products from ACTIVE vendors with stock > 0
     */
    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) java.util.UUID zoneId) {
        if (zoneId != null) {
            return productService.getPublishedProductsByZone(zoneId);
        }
        if (city != null) {
            return productService.getPublishedProductsByCity(city);
        }
        if (category != null) {
            return productService.getPublishedProductsByCategory(category);
        }
        return productService.getPublishedProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(
            @PathVariable Long id,
            @RequestParam(required = false) java.util.UUID zoneId) {
        return productService.getProductById(id)
                .map(p -> {
                    if (zoneId != null) {
                        productService.applyTieredPricingByZoneId(p, zoneId);
                    }
                    return ResponseEntity.ok(p);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/home")
    public List<Product> getHomeProducts(@RequestParam(required = false) java.util.UUID zoneId) {
        List<Product> products = productService.getPublishedForHome();
        if (zoneId != null) {
            products.forEach(p -> productService.applyTieredPricingByZoneId(p, zoneId));
        }
        return products;
    }

    @GetMapping("/jiffy-street")
    public List<Product> getJiffyStreetProducts(@RequestParam(required = false) java.util.UUID zoneId) {
        List<Product> products = productService.getPublishedForJiffyStreet();
        if (zoneId != null) {
            products.forEach(p -> productService.applyTieredPricingByZoneId(p, zoneId));
        }
        return products;
    }

    @GetMapping("/jiffy-cafe")
    public List<Product> getJiffyCafeProducts(@RequestParam(required = false) java.util.UUID zoneId) {
        List<Product> products = productService.getPublishedForJiffyCafe();
        if (zoneId != null) {
            products.forEach(p -> productService.applyTieredPricingByZoneId(p, zoneId));
        }
        return products;
    }
}
