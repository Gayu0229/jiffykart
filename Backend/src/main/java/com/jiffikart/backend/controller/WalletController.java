package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Wallet;
import com.jiffikart.backend.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    @Autowired
    private WalletService walletService;

    @GetMapping("/{userId}")
    public Wallet getWallet(@PathVariable Long userId) {
        return walletService.getWalletByUserId(userId);
    }

    @PostMapping("/transaction")
    public Wallet addTransaction(@RequestBody TransactionRequest request) {
        return walletService.addTransaction(request.getUserId(), request.getAmount(), request.getType(),
                request.getDescription());
    }
}

class TransactionRequest {
    private Long userId;
    private Double amount;
    private String type;
    private String description;

    public Long getUserId() {
        return userId;
    }

    public Double getAmount() {
        return amount;
    }

    public String getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }
}
