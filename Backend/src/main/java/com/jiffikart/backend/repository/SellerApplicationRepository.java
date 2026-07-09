package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.SellerApplication;
import com.jiffikart.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SellerApplicationRepository extends JpaRepository<SellerApplication, Long> {
    List<SellerApplication> findByStatus(String status);
    List<SellerApplication> findByUser(User user);
    Optional<SellerApplication> findByUserAndStatus(User user, String status);
    List<SellerApplication> findByPincodeIn(java.util.Collection<String> pincodes);
    List<SellerApplication> findByPincodeInAndStatus(java.util.Collection<String> pincodes, String status);
}
