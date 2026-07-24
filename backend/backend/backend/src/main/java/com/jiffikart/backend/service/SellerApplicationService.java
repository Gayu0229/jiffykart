package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SellerApplicationService {

    @Autowired
    private SellerApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private LocationFilterService locationFilterService;

    @Autowired
    private StatsService statsService;

    public boolean hasActiveApplication(User user) {
        List<SellerApplication> existingApps = applicationRepository.findByUser(user);
        return existingApps.stream()
                .anyMatch(app -> !app.getStatus().equals("REJECTED"));
    }

    public void submitApplication(SellerApplication application) {
        User user = application.getUser();

        // 1. Check if already a Vendor
        if (user.getRole() == Role.VENDOR) {
            throw new RuntimeException("You are already a registered vendor.");
        }

        // 2. Check for any existing application that is NOT Rejected
        List<SellerApplication> existingApps = applicationRepository.findByUser(user);
        boolean hasActiveApp = existingApps.stream()
                .anyMatch(app -> !app.getStatus().equals("REJECTED"));

        if (hasActiveApp) {
            throw new RuntimeException("You already have an active or pending application.");
        }

        application.setStatus("PENDING");
        applicationRepository.save(application);
        notificationService.notifyAdmin("New seller application from " + application.getUser().getName());
    }

    public List<SellerApplication> getAllByStatus(String status) {
        return applicationRepository.findByStatus(status);
    }

    public List<SellerApplication> getApplicationsForUser(User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) {
            return applicationRepository.findAll();
        } else if ("FIELD_MANAGER".equalsIgnoreCase(user.getRole().name())) {
            java.util.Set<String> pincodes = locationFilterService.getEffectivePincodesForFieldManager(user.getId());
            return applicationRepository.findByPincodeIn(pincodes);
        }
        return java.util.Collections.emptyList();
    }

    public List<SellerApplication> getApplicationsByStatusForUser(String status, User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) {
            return applicationRepository.findByStatus(status);
        } else if ("FIELD_MANAGER".equalsIgnoreCase(user.getRole().name())) {
            java.util.Set<String> pincodes = locationFilterService.getEffectivePincodesForFieldManager(user.getId());
            return applicationRepository.findByPincodeInAndStatus(pincodes, status);
        }
        return java.util.Collections.emptyList();
    }

    public boolean canUserAccessApplication(User user, SellerApplication application) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().name())) return true;
        if ("FIELD_MANAGER".equalsIgnoreCase(user.getRole().name())) {
            return locationFilterService.isPincodeAccessible(user.getId(), application.getPincode());
        }
        return false;
    }

    @Transactional
    public void approveApplication(Long applicationId) {
        SellerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!"PENDING".equals(application.getStatus())) {
            throw new RuntimeException("Application is already processed.");
        }

        User user = application.getUser();

        // 1. Upgrade Role
        user.setRole(Role.VENDOR);
        userRepository.save(user);

        // 2. Initialize Shop
        Shop shop = Shop.builder()
                .owner(user)
                .name(application.getShopName())
                .description(application.getBusinessDescription())
                .location(application.getAddress()) // legacy field, map address here
                .address(application.getAddress())
                .area(application.getArea())
                .city(application.getCity())
                .state(application.getState())
                .pincode(application.getPincode())
                .shopType("Official")
                .businessType(application.getBusinessType())
                .category(application.getCategory())
                .gstNumber(application.getGstNumber())
                .panNumber(application.getPanNumber())
                .accountHolderName(application.getAccountHolderName())
                .bankAccountNumber(application.getBankAccountNumber())
                .ifscCode(application.getIfscCode())
                .email(user.getEmail()) // Use user's contact as initial shop contact
                .phone(user.getPhone())
                .approvalStatus("APPROVED")
                .isActive(true)
                .kycStatus("VERIFIED") // Admin approved implies KYC verified
                
                // KYC Documents
                .idProofUrl(application.getIdProofUrl())
                .businessProofUrl(application.getBusinessProofUrl())
                .addressProofUrl(application.getAddressProofUrl())
                .cancelledChequeUrl(application.getCancelledChequeUrl())
                
                // Food Specific
                .vendorType(application.getVendorType())
                .cuisineType(application.getCuisineType())
                .fssaiNumber(application.getFssaiNumber())
                .openingTime(application.getOpeningTime())
                .closingTime(application.getClosingTime())

                // Defaults
                .rating(0.0)
                .ratingCount("0")
                .deliveryTime("30-45 min")
                .costForTwo("₹200")
                .image(null) // Generic store placeholder removed
                .tags(java.util.Arrays.asList(application.getCategory(), application.getBusinessType(), application.getCity())) // Default tags
                .distance("2.5 km") // Mock distance
                .build();
        shopRepository.save(shop);

        // 3. Update Application Status
        application.setStatus("APPROVED");
        applicationRepository.save(application);

        // 4. Notify
        notificationService.notifyProductUpdate(null, "Congratulations! Your seller application for '" + application.getShopName() + "' has been approved.");
        
        // 5. Email
        emailService.sendVendorApprovalEmail(user.getEmail(), application.getShopName(), user.getName());

        // 6. Update public stats
        statsService.updateAndBroadcast();
    }

    public void rejectApplication(Long applicationId, String reason) {
        SellerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus("REJECTED");
        application.setRejectionReason(reason);
        applicationRepository.save(application);

        // Notify
        notificationService.notifyProductUpdate(null, "Your seller application for '" + application.getShopName() + "' was rejected. Reason: " + reason);

        // Email
        emailService.sendVendorRejectionEmail(application.getUser().getEmail(), application.getShopName(), application.getUser().getName(), reason);

        // Update public stats
        statsService.updateAndBroadcast();
    }
}
