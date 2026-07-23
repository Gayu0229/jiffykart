package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.VendorProfileResponse;
import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class VendorProfileService {

    @Autowired
    private ShopRepository shopRepository;

    /**
     * Fetches the vendor profile for the given user.
     * Only returns data if the vendor's shop is ACTIVE (i.e., admin approved).
     *
     * @param user The authenticated vendor user
     * @return VendorProfileResponse with business details
     * @throws RuntimeException if shop not found or vendor not approved
     */
    public VendorProfileResponse getVendorProfile(User user) {
        Optional<Shop> shopOpt = shopRepository.findFirstByOwnerOrderByIdAsc(user);

        if (shopOpt.isEmpty()) {
            throw new VendorProfileNotFoundException("Vendor profile not completed. No shop found.");
        }

        Shop shop = shopOpt.get();

        if (!"APPROVED".equalsIgnoreCase(shop.getApprovalStatus())) {
            throw new VendorNotApprovedException("Vendor is not approved. Current status: " + shop.getApprovalStatus());
        }

        return mapToResponse(shop);
    }

    /**
     * Fetches the vendor profile by shop ID (used when vendorId is in JWT).
     * Validates ownership against the authenticated user.
     */
    public VendorProfileResponse getVendorProfileByShopId(Long shopId, User user) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new VendorProfileNotFoundException("Shop not found for ID: " + shopId));

        // Security: ensure shop belongs to user
        if (!shop.getOwner().getId().equals(user.getId())) {
            throw new VendorNotApprovedException("Unauthorized access to shop profile.");
        }

        return mapToResponse(shop);
    }

    private VendorProfileResponse mapToResponse(Shop shop) {
        return VendorProfileResponse.builder()
                .shopName(shop.getName())
                .businessType(shop.getBusinessType())
                .category(shop.getCategory())
                .gstNumber(shop.getGstNumber())
                .businessAddress(shop.getAddress())
                .city(shop.getCity())
                .state(shop.getState())
                .area(shop.getArea())
                .bannerUrl(shop.getBannerUrl())
                .logoUrl(shop.getLogoUrl())
                .status(shop.getApprovalStatus())
                .email(shop.getEmail())
                .phone(shop.getPhone())
                .pincode(shop.getPincode())
                .vendorType(shop.getVendorType() != null ? shop.getVendorType().name() : null)
                .businessModel(shop.getBusinessModel())
                .shopId(shop.getId())
                .build();
    }

    // Custom exceptions for clean error handling
    public static class VendorProfileNotFoundException extends RuntimeException {
        public VendorProfileNotFoundException(String message) {
            super(message);
        }
    }

    public static class VendorNotApprovedException extends RuntimeException {
        public VendorNotApprovedException(String message) {
            super(message);
        }
    }
}
