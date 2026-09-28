package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jiffikart.backend.entity.User;
import java.util.*;

public interface ShopRepository extends JpaRepository<Shop, Long> {
    // Public listing queries (approved + active only)
    List<Shop> findByApprovalStatusAndIsActive(String approvalStatus, Boolean isActive);
    List<Shop> findByCityAndApprovalStatusAndIsActive(String city, String approvalStatus, Boolean isActive);
    List<Shop> findByCategoryAndApprovalStatusAndIsActive(String category, String approvalStatus, Boolean isActive);
    List<Shop> findByCityAndCategoryAndApprovalStatusAndIsActive(String city, String category, String approvalStatus, Boolean isActive);
    List<Shop> findByCityAndAreaAndApprovalStatusAndIsActive(String city, String area, String approvalStatus, Boolean isActive);
    List<Shop> findByCityAndAreaAndCategoryAndApprovalStatusAndIsActive(String city, String area, String category, String approvalStatus, Boolean isActive);

    // Admin queries
    List<Shop> findByApprovalStatus(String approvalStatus);
    List<Shop> findByPincodeIn(Collection<String> pincodes);
    List<Shop> findByPincodeInAndApprovalStatus(Collection<String> pincodes, String approvalStatus);

    // Owner queries
    Optional<Shop> findByOwner(User owner);
    Optional<Shop> findByOwner_Id(Long ownerId);
    Optional<Shop> findFirstByOwnerOrderByIdAsc(User owner);
    Optional<Shop> findFirstByOwner_IdOrderByIdAsc(Long ownerId);
    // Stats queries
    long countByKycStatusAndIsActive(String kycStatus, Boolean isActive);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT s.city) FROM Shop s WHERE s.isActive = :isActive")
    long countDistinctCityByIsActive(Boolean isActive);

    Optional<Shop> findFirstByShopType(String shopType);
}
