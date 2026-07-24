package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.LocationProductDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationProductDetailRepository extends JpaRepository<LocationProductDetail, Long> {
    List<LocationProductDetail> findByProductId(Long productId);
    List<LocationProductDetail> findByCityId(UUID cityId);
    Optional<LocationProductDetail> findByProductIdAndCityId(Long productId, UUID cityId);
}
