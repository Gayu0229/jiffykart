package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ShopService {
    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private LocationFilterService locationFilterService;

    // ─── Public listing (only APPROVED + active) ───
    public List<Shop> getAllShops() {
        return shopRepository.findByApprovalStatusAndIsActive("APPROVED", true);
    }

    public List<Shop> getShopsByCity(String city) {
        return shopRepository.findByCityAndApprovalStatusAndIsActive(city, "APPROVED", true);
    }

    public List<Shop> getShopsByCategory(String category) {
        return shopRepository.findByCategoryAndApprovalStatusAndIsActive(category, "APPROVED", true);
    }

    public List<Shop> getShopsByCityAndCategory(String city, String category) {
        return shopRepository.findByCityAndCategoryAndApprovalStatusAndIsActive(city, category, "APPROVED", true);
    }

    public List<Shop> getShopsByCityAndArea(String city, String area) {
        return shopRepository.findByCityAndAreaAndApprovalStatusAndIsActive(city, area, "APPROVED", true);
    }

    public List<Shop> getShopsByCityAndAreaAndCategory(String city, String area, String category) {
        return shopRepository.findByCityAndAreaAndCategoryAndApprovalStatusAndIsActive(city, area, category, "APPROVED", true);
    }

    // ─── Admin/Field Manager queries (Location-Based) ───
    public List<Shop> getShopsForUser(User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) {
            return shopRepository.findAll();
        } else if ("FIELD_MANAGER".equalsIgnoreCase(user.getRole().name())) {
            java.util.Set<String> pincodes = locationFilterService.getEffectivePincodesForFieldManager(user.getId());
            return shopRepository.findByPincodeIn(pincodes);
        }
        return java.util.Collections.emptyList();
    }

    public List<Shop> getShopsByApprovalStatus(String status) {
        return shopRepository.findByApprovalStatus(status);
    }

    public List<Shop> getShopsByApprovalStatusForUser(String status, User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) {
            return shopRepository.findByApprovalStatus(status);
        } else if ("FIELD_MANAGER".equalsIgnoreCase(user.getRole().name())) {
            java.util.Set<String> pincodes = locationFilterService.getEffectivePincodesForFieldManager(user.getId());
            return shopRepository.findByPincodeInAndApprovalStatus(pincodes, status);
        }
        return java.util.Collections.emptyList();
    }

    // ─── Common ───
    public Optional<Shop> getShopById(Long id) {
        return shopRepository.findById(id);
    }

    public boolean canUserAccessShop(User user, Shop shop) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) return true;
        if ("FIELD_MANAGER".equalsIgnoreCase(user.getRole().name())) {
            return locationFilterService.isPincodeAccessible(user.getId(), shop.getPincode());
        }
        return false;
    }

    public Shop saveShop(Shop shop) {
        return shopRepository.save(shop);
    }
}
