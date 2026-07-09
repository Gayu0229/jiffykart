package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import com.jiffikart.backend.entity.Shop;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_Id(Long userId);
    List<Order> findByShop_Id(Long shopId);
    List<Order> findByShop_IdIn(List<Long> shopIds);
    List<Order> findByShop(Shop shop);
    long countByShop(Shop shop);
    @org.springframework.data.jpa.repository.Query("SELECT new com.jiffikart.backend.dto.VendorCustomerDTO(" +
           "u.id, u.name, u.email, u.phone, u.avatar, COUNT(o), SUM(o.total)) " +
           "FROM Order o JOIN o.user u WHERE o.shop.id = :shopId " +
           "GROUP BY u.id, u.name, u.email, u.phone, u.avatar")
    List<com.jiffikart.backend.dto.VendorCustomerDTO> findVendorCustomers(Long shopId);

    Optional<Order> findByMerchantTransactionId(String merchantTransactionId);

    @org.springframework.data.jpa.repository.Query("SELECT CAST(ROUND(AVG(o.deliveryTimeMinutes)) AS integer) FROM Order o WHERE o.orderStatus = 'DELIVERED' AND o.deliveryTimeMinutes IS NOT NULL")
    Integer getAverageDeliveryTime();
    
    List<Order> findByPaymentStatus(String paymentStatus);
}
