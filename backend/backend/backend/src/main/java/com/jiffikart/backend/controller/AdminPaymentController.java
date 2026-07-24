package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.*;
import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import com.jiffikart.backend.service.WalletService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    private final ShopRepository shopRepository;
    private final WalletService walletService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public AdminPaymentController(ShopRepository shopRepository,
                                  WalletService walletService,
                                  TransactionRepository transactionRepository,
                                  UserRepository userRepository) {
        this.shopRepository = shopRepository;
        this.walletService = walletService;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/vendors")
    public ResponseEntity<?> getAllVendors() {
        try {
            List<Shop> shops = shopRepository.findAll();
            List<VendorPaymentDTO> dtos = new ArrayList<>();
            for (Shop shop : shops) {
                User owner = shop.getOwner();
                if (owner == null) {
                    continue;
                }
                
                // Get or initialize wallet
                Wallet wallet = walletService.getWalletByUserId(owner.getId());
                Double balance = wallet != null ? wallet.getBalance() : 0.0;

                VendorPaymentDTO dto = VendorPaymentDTO.builder()
                        .vendorId(owner.getId())
                        .shopId(shop.getId())
                        .shopName(shop.getName())
                        .ownerName(owner.getName())
                        .email(owner.getEmail())
                        .phone(owner.getPhone())
                        .walletBalance(balance)
                        .pendingPayout(0.0) // Temporary/default implementation
                        .lastPayoutDate(null) // Temporary/default implementation
                        .shopStatus(shop.getApprovalStatus() != null ? shop.getApprovalStatus() : "PENDING")
                        .build();
                dtos.add(dto);
            }
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Unexpected exception: " + e.getMessage()));
        }
    }

    @GetMapping("/vendors/{vendorId}/wallet-history")
    public ResponseEntity<?> getWalletHistory(@PathVariable Long vendorId) {
        try {
            if (!userRepository.existsById(vendorId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Vendor not found"));
            }

            List<Transaction> transactions = transactionRepository.findByWallet_User_IdOrderByDateDesc(vendorId);
            List<WalletHistoryDTO> history = transactions.stream().map(t -> WalletHistoryDTO.builder()
                    .id(t.getId())
                    .amount(t.getAmount())
                    .type(t.getType())
                    .description(t.getDescription())
                    .status(t.getStatus())
                    .date(t.getDate())
                    .build()).collect(Collectors.toList());

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Unexpected exception: " + e.getMessage()));
        }
    }

    @PostMapping("/vendors/{vendorId}/wallet/add")
    public ResponseEntity<?> addWalletFunds(@PathVariable Long vendorId, @RequestBody WalletAddRequest request) {
        try {
            if (!userRepository.existsById(vendorId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Vendor not found"));
            }

            if (request.getAmount() == null || request.getAmount() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(false, "Invalid amount"));
            }

            Wallet updatedWallet = walletService.addTransaction(vendorId, request.getAmount(), "credit", request.getReason());
            return ResponseEntity.ok(updatedWallet);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Unexpected exception: " + e.getMessage()));
        }
    }

    @PatchMapping("/vendors/{vendorId}/payout-status")
    public ResponseEntity<?> updatePayoutStatus(@PathVariable Long vendorId, @RequestBody PayoutStatusRequest request) {
        try {
            if (!userRepository.existsById(vendorId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Vendor not found"));
            }

            // Temporary implementation as Payout table/entity does not exist
            return ResponseEntity.ok(new ApiResponse(true, "Payout status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Unexpected exception: " + e.getMessage()));
        }
    }
}
