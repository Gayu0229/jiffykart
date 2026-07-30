package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.VendorType;
import com.jiffikart.backend.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DatabaseFixerService {

    @Autowired
    private ShopRepository shopRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void fixDatabase() {
        System.out.println("🔧 Running DatabaseFixerService to ensure food shops have FOOD vendor type...");
        try {
            List<Shop> shops = shopRepository.findAll();
            for (Shop shop : shops) {
                boolean isFoodShop = false;
                
                if (shop.getCategory() != null && (
                    shop.getCategory().equalsIgnoreCase("Food") ||
                    shop.getCategory().equalsIgnoreCase("Restaurants") ||
                    shop.getCategory().equalsIgnoreCase("Cafe") ||
                    shop.getCategory().equalsIgnoreCase("Jiffy Cafe")
                )) {
                    isFoodShop = true;
                }

                if (shop.getCuisineType() != null && !shop.getCuisineType().trim().isEmpty()) {
                    isFoodShop = true;
                }

                if (isFoodShop && shop.getVendorType() != VendorType.FOOD_VENDOR) {
                    System.out.println("Updating shop " + shop.getName() + " vendorType to FOOD_VENDOR");
                    shop.setVendorType(VendorType.FOOD_VENDOR);
                    shopRepository.save(shop);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fix database: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
