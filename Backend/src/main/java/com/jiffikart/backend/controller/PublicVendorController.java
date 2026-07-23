package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.SellerApplication;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.entity.VendorType;
import com.jiffikart.backend.entity.Role;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.FileStorageService;
import com.jiffikart.backend.service.SellerApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/vendor")
public class PublicVendorController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SellerApplicationService applicationService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping(value = "/apply", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> applyForVendor(
            // User Details
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("password") String password,
            
            // Business Details
            @RequestParam("shopName") String shopName,
            @RequestParam("businessType") String businessType,
            @RequestParam("category") String category,
            @RequestParam(value = "gstNumber", required = false) String gstNumber,
            
            // Address
            @RequestParam("address") String address,
            @RequestParam("area") String area,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("pincode") String pincode,
            
            // KYC
            @RequestParam("panNumber") String panNumber,
            @RequestParam("accountHolderName") String accountHolderName,
            @RequestParam("bankAccountNumber") String bankAccountNumber,
            @RequestParam("ifscCode") String ifscCode,
            
            // Food Specific
            @RequestParam(value = "vendorType", required = false) String vendorType,
            @RequestParam(value = "cuisineType", required = false) String cuisineType,
            @RequestParam(value = "fssaiNumber", required = false) String fssaiNumber,
            @RequestParam(value = "openingTime", required = false) String openingTime,
            @RequestParam(value = "closingTime", required = false) String closingTime,
            @RequestParam(value = "businessModel", required = false) String businessModel,
            @RequestParam(value = "foodBusinessType", required = false) String foodBusinessType,
            @RequestParam(value = "restaurantName", required = false) String restaurantName,
            @RequestParam(value = "deliveryRadius", required = false) Double deliveryRadius,
            @RequestParam(value = "restaurantCapacity", required = false) Integer restaurantCapacity,
            @RequestParam(value = "indoorSeats", required = false) Integer indoorSeats,
            @RequestParam(value = "outdoorSeats", required = false) Integer outdoorSeats,
            @RequestParam(value = "reservationEnabled", required = false) Boolean reservationEnabled,
            @RequestParam(value = "kitchenType", required = false) String kitchenType,
            @RequestParam(value = "vegNonVeg", required = false) String vegNonVeg,
            @RequestParam(value = "restaurantCategory", required = false) String restaurantCategory,
            @RequestParam(value = "diningType", required = false) String diningType,
            @RequestParam(value = "parkingAvailable", required = false) Boolean parkingAvailable,

            // Files
            @RequestParam("idProof") MultipartFile idProof,
            @RequestParam("businessProof") MultipartFile businessProof,
            @RequestParam("addressProof") MultipartFile addressProof,
            @RequestParam("cancelledCheque") MultipartFile cancelledCheque
    ) {
        // 1. Check if User exists
        Optional<User> existingUser = userRepository.findFirstByPhoneOrderByIdAsc(phone);
        if (existingUser.isEmpty()) {
            existingUser = userRepository.findByEmailIgnoreCase(email);
        }

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            
            // CRITICAL: Block if already a vendor
            if (user.getRole() == Role.VENDOR) {
                return ResponseEntity.badRequest().body(Map.of("message", "You are already a registered vendor. Cannot apply again."));
            }
            
            // CRITICAL: Block if already has a non-rejected application
            boolean hasActiveApp = applicationService.hasActiveApplication(user);
            if (hasActiveApp) {
                return ResponseEntity.badRequest().body(Map.of("message", "You already have a pending or approved application."));
            }
        } else {
            // 2. Create new User
            user = User.builder()
                    .name(name)
                    .email(email)
                    .phone(phone)
                    .password(passwordEncoder.encode(password))
                    .role(Role.CUSTOMER) // Default to Customer
                    .enabled(true)
                    .build();
            user = userRepository.save(user);
        }

        // 3. Store Files (only after all checks pass)
        String idProofUrl = fileStorageService.storeFile(idProof);
        String businessProofUrl = fileStorageService.storeFile(businessProof);
        String addressProofUrl = fileStorageService.storeFile(addressProof);
        String cancelledChequeUrl = fileStorageService.storeFile(cancelledCheque);

        // 4. Create Application
        SellerApplication application = SellerApplication.builder()
                .user(user)
                .shopName(shopName)
                .businessDescription(businessType + " | " + category)
                .businessType(businessType)
                .category(category)
                .hasGst(gstNumber != null && !gstNumber.isBlank())
                .gstNumber(gstNumber)
                .address(address)
                .area(area)
                .city(city)
                .state(state)
                .pincode(pincode)
                .panNumber(panNumber)
                .accountHolderName(accountHolderName)
                .bankAccountNumber(bankAccountNumber)
                .ifscCode(ifscCode)
                .idProofUrl(idProofUrl)
                .businessProofUrl(businessProofUrl)
                .addressProofUrl(addressProofUrl)
                .cancelledChequeUrl(cancelledChequeUrl)
                .status("PENDING")
                .vendorType(vendorType != null ? VendorType.valueOf(vendorType) : VendorType.VENDOR)
                .cuisineType(cuisineType)
                .fssaiNumber(fssaiNumber)
                .openingTime(openingTime)
                .closingTime(closingTime)
                .businessModel(businessModel)
                .foodBusinessType(foodBusinessType)
                .restaurantName(restaurantName)
                .deliveryRadius(deliveryRadius)
                .restaurantCapacity(restaurantCapacity)
                .indoorSeats(indoorSeats)
                .outdoorSeats(outdoorSeats)
                .reservationEnabled(reservationEnabled != null ? reservationEnabled : false)
                .kitchenType(kitchenType)
                .vegNonVeg(vegNonVeg)
                .restaurantCategory(restaurantCategory)
                .diningType(diningType)
                .parkingAvailable(parkingAvailable != null ? parkingAvailable : false)
                .build();

        applicationService.submitApplication(application);

        return ResponseEntity.ok(Map.of("message", "Application submitted successfully"));
    }
}
