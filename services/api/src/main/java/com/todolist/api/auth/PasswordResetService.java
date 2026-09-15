package com.todolist.api.auth;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todolist.api.auth.dto.ForgotPasswordRequest;
import com.todolist.api.auth.dto.ResetPasswordRequest;
import com.todolist.api.shared.exception.InvalidPasswordResetCodeException;
import com.todolist.api.user.User;
import com.todolist.api.user.UserRepository;
import com.todolist.contracts.event.PasswordResetRequestedEvent;

@Service
public class PasswordResetService {
	static final Duration CODE_VALIDITY = Duration.ofMinutes(15);
	static final int MAX_ATTEMPTS = 5;

	private final UserRepository userRepository;
	private final PasswordResetCodeRepository codeRepository;
	private final PasswordEncoder passwordEncoder;
	private final ApplicationEventPublisher eventPublisher;
	private final SecureRandom secureRandom = new SecureRandom();

	public PasswordResetService(UserRepository userRepository, PasswordResetCodeRepository codeRepository,
			PasswordEncoder passwordEncoder, ApplicationEventPublisher eventPublisher) {
		this.userRepository = userRepository;
		this.codeRepository = codeRepository;
		this.passwordEncoder = passwordEncoder;
		this.eventPublisher = eventPublisher;
	}

	@Transactional
	public void requestReset(ForgotPasswordRequest request) {
		Optional<User> user = userRepository.findByEmail(Emails.normalize(request.email()));

		String code = String.format("%06d", secureRandom.nextInt(1_000_000));
		String codeHash = passwordEncoder.encode(code);
		if (user.isEmpty()) {
			return;
		}

		Instant now = Instant.now();
		codeRepository.invalidateActiveCodes(user.get().getId(), now);
		PasswordResetCode resetCode = codeRepository.save(
				new PasswordResetCode(user.get(), codeHash, now.plus(CODE_VALIDITY)));

		eventPublisher.publishEvent(new PasswordResetRequestedEvent(user.get().getId(), user.get().getName(),
				user.get().getEmail(), code, resetCode.getExpiresAt()));
	}

	// noRollbackFor keeps the failed attempt counter even though the method ends with an exception.
	@Transactional(noRollbackFor = InvalidPasswordResetCodeException.class)
	public void resetPassword(ResetPasswordRequest request) {
		User user = userRepository.findByEmail(Emails.normalize(request.email())).orElseThrow(InvalidPasswordResetCodeException::new);

		Instant now = Instant.now();
		PasswordResetCode resetCode = codeRepository.findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
				.filter(code -> code.isUsable(now, MAX_ATTEMPTS))
				.orElseThrow(InvalidPasswordResetCodeException::new);

		if (!passwordEncoder.matches(request.code(), resetCode.getCodeHash())) {
			resetCode.registerFailedAttempt();
			throw new InvalidPasswordResetCodeException();
		}

		user.changePassword(passwordEncoder.encode(request.newPassword()));
		resetCode.markUsed(now);
	}
}
