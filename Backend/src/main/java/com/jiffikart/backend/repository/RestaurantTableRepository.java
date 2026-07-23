package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.RestaurantTable;
import com.jiffikart.backend.entity.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByShopId(Long shopId);
    List<RestaurantTable> findByShopIdAndStatus(Long shopId, TableStatus status);
}
