package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Wallet;
import com.jiffikart.backend.entity.Transaction;
import com.jiffikart.backend.repository.WalletRepository;
import com.jiffikart.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class WalletService {
    @Autowired
    private WalletRepository walletRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private com.jiffikart.backend.repository.UserRepository userRepository;

    public Wallet getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            com.jiffikart.backend.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            Wallet newWallet = Wallet.builder()
                    .user(user)
                    .balance(0.0)
                    .build();
            return walletRepository.save(newWallet);
        });
    }

    @Transactional
    public Wallet addTransaction(Long userId, Double amount, String type, String description) {
        Wallet wallet = getWalletByUserId(userId);

        if ("debit".equals(type)) {
            wallet.setBalance(wallet.getBalance() - amount);
        } else {
            wallet.setBalance(wallet.getBalance() + amount);
        }

        Transaction t = Transaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type(type)
                .description(description)
                .date(LocalDateTime.now())
                .status("completed")
                .build();

        transactionRepository.save(t);
        return walletRepository.save(wallet);
    }
}
