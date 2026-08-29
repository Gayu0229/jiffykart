package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);

    // Safe version: returns first match when duplicates exist
    Optional<User> findFirstByPhoneOrderByIdAsc(String phone);

    // For finding and cleaning up duplicates
    List<User> findAllByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);
    
    List<User> findByRole(com.jiffikart.backend.entity.Role role);
    long countByRole(com.jiffikart.backend.entity.Role role);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}
