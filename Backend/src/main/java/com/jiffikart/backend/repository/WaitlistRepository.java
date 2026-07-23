package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {
    List<Waitlist> findByShopIdAndStatusOrderByQueuePositionAsc(Long shopId, String status);
    List<Waitlist> findByShopIdAndStatusOrderByQueuePositionDesc(Long shopId, String status);
    Optional<Waitlist> findByUserIdAndStatus(Long userId, String status);
}
