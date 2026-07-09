package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findByIsActiveTrue();
    List<BlogPost> findByCityIdAndIsActiveTrue(UUID cityId);
    List<BlogPost> findByCityIdAndZoneIdIsNullAndIsActiveTrue(UUID cityId);
    List<BlogPost> findByZoneIdAndIsActiveTrue(UUID zoneId);
    List<BlogPost> findByCityIdIsNullAndIsActiveTrue();
    List<BlogPost> findByCityIdIsNullAndZoneIdIsNullAndIsActiveTrue();
}
