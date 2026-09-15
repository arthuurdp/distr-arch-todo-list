package com.todolist.api.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {
	Optional<PasswordResetCode> findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(UUID userId);

	@Modifying
	@Query("UPDATE PasswordResetCode c SET c.usedAt = :now WHERE c.user.id = :userId AND c.usedAt IS NULL")
	int invalidateActiveCodes(@Param("userId") UUID userId, @Param("now") Instant now);
}
