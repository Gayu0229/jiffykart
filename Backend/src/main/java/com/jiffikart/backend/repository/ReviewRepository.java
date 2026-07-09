package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct_Id(Long productId);

    List<Review> findByShop_Id(Long shopId);
}
