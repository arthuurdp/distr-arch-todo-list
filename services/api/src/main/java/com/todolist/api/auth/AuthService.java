package com.todolist.api.auth;

import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todolist.api.auth.dto.LoginRequest;
import com.todolist.api.auth.dto.RegisterRequest;
import com.todolist.api.auth.dto.TokenResponse;
import com.todolist.api.shared.exception.ConflictException;
import com.todolist.api.shared.exception.InvalidCredentialsException;
import com.todolist.api.user.User;
import com.todolist.api.user.UserRepository;
import com.todolist.api.user.dto.UserResponse;
import com.todolist.api.user.mapper.UserMapper;
import com.todolist.contracts.event.UserRegisteredEvent;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;
	private final ApplicationEventPublisher eventPublisher;
	private final String fakePasswordHash;

	public AuthService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder, TokenService tokenService,
			ApplicationEventPublisher eventPublisher) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
		this.eventPublisher = eventPublisher;
		this.fakePasswordHash = passwordEncoder.encode("fake-password-used-for-unknown-emails");
	}

	@Transactional
	public UserResponse register(RegisterRequest request) {
		String email = Emails.normalize(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new ConflictException("Email is already registered");
		}

		User user = new User(request.name().trim(), email, passwordEncoder.encode(request.password()));
		User savedUser;
		try {
			savedUser = userRepository.saveAndFlush(user);
		} catch (DataIntegrityViolationException ex) {
			throw new ConflictException("Email is already registered");
		}

		eventPublisher.publishEvent(new UserRegisteredEvent(savedUser.getId(), savedUser.getName(), savedUser.getEmail()));
		return userMapper.toResponse(savedUser);
	}

	@Transactional(readOnly = true)
	public TokenResponse login(LoginRequest request) {
		Optional<User> user = userRepository.findByEmail(Emails.normalize(request.email()));

		String passwordHash = user.map(User::getPasswordHash).orElse(fakePasswordHash);
		boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);

		if (user.isEmpty() || !passwordMatches) {
			throw new InvalidCredentialsException();
		}
		return tokenService.issueToken(user.get());
	}
}
