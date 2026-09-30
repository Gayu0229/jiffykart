package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Wallet;
import com.jiffikart.backend.entity.Transaction;
import com.jiffikart.backend.repository.WalletRepository;
import com.jiffikart.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;

@Service
public class WalletService {
    private static final Logger logger = LoggerFactory.getLogger(WalletService.class);


    @Autowired
    private WalletRepository walletRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private com.jiffikart.backend.repository.UserRepository userRepository;

    public Wallet getWalletByUserId(Long userId) {
        if (userId == null) {
            return Wallet.builder().id(0L).balance(0.0).build();
        }
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            com.jiffikart.backend.entity.User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                logger.warn("Wallet requested for non-existent user id: {}. Returning zero-balance wallet placeholder.", userId);
                return Wallet.builder().id(0L).balance(0.0).build();
            }
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
