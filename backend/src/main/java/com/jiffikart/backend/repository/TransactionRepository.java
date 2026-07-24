package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByWallet_User_IdOrderByDateDesc(Long userId);
}
