package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.OtpType;
import com.jiffikart.backend.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    // Original — can crash if duplicates exist
    Optional<VerificationToken> findByIdentifierIgnoreCaseAndType(String identifier, OtpType type);

    // Safe version: returns the most recent token when duplicates exist
    Optional<VerificationToken> findFirstByIdentifierIgnoreCaseAndTypeOrderByCreatedAtDesc(String identifier, OtpType type);

    // Find all tokens for cleanup
    List<VerificationToken> findAllByIdentifierIgnoreCaseAndType(String identifier, OtpType type);

    @Modifying
    @Transactional
    void deleteByIdentifierIgnoreCaseAndType(String identifier, OtpType type);

    @Modifying
    @Transactional
    void deleteByExpiryDateBefore(LocalDateTime now);
}
