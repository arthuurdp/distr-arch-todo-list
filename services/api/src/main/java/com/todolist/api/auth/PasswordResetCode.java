package com.todolist.api.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import com.todolist.api.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "password_reset_codes")
public class PasswordResetCode {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false, updatable = false)
	private User user;

	@Column(name = "code_hash", nullable = false, length = 100, updatable = false)
	private String codeHash;

	@Column(name = "expires_at", nullable = false, updatable = false)
	private Instant expiresAt;

	@Column(nullable = false)
	private int attempts;

	@Column(name = "used_at")
	private Instant usedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected PasswordResetCode() {
	}

	public PasswordResetCode(User user, String codeHash, Instant expiresAt) {
		this.user = user;
		this.codeHash = codeHash;
		this.expiresAt = expiresAt.truncatedTo(ChronoUnit.MICROS);
	}

	public boolean isUsable(Instant now, int maxAttempts) {
		return usedAt == null && now.isBefore(expiresAt) && attempts < maxAttempts;
	}

	public void registerFailedAttempt() {
		this.attempts++;
	}

	public void markUsed(Instant now) {
		this.usedAt = now.truncatedTo(ChronoUnit.MICROS);
	}

	@PrePersist
	void onCreate() {
		this.createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
	}

	public UUID getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public String getCodeHash() {
		return codeHash;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public int getAttempts() {
		return attempts;
	}
}
