package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.RestaurantStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantStaffRepository extends JpaRepository<RestaurantStaff, Long> {
    List<RestaurantStaff> findByShopId(Long shopId);
    List<RestaurantStaff> findByUserId(Long userId);
    Optional<RestaurantStaff> findByShopIdAndUserId(Long shopId, Long userId);
}
