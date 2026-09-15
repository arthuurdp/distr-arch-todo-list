package com.todolist.api.support;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.todolist.api.auth.TokenService;
import com.todolist.api.user.enums.Role;
import com.todolist.api.user.User;
import com.todolist.api.user.UserRepository;

@TestComponent
public class AuthTestSupport {
	public static final String SEEDED_ADMIN_EMAIL = "admin@todolist.com";
	public static final String SEEDED_ADMIN_PASSWORD = "Admin@12345";
	public static final String DEFAULT_PASSWORD = "Password123!";

	private final JdbcTemplate jdbcTemplate;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;

	public AuthTestSupport(JdbcTemplate jdbcTemplate, UserRepository userRepository, PasswordEncoder passwordEncoder,
			TokenService tokenService) {
		this.jdbcTemplate = jdbcTemplate;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
	}
	public void resetDatabase() {
		jdbcTemplate.update("DELETE FROM password_reset_codes");
		jdbcTemplate.update("DELETE FROM todos");
		jdbcTemplate.update("DELETE FROM users WHERE email <> ?", SEEDED_ADMIN_EMAIL);
	}

	public User createUser(String email, Role role) {
		User user = new User("Test", email, passwordEncoder.encode(DEFAULT_PASSWORD));
		user.changeRole(role);
		return userRepository.save(user);
	}

	public String bearerTokenFor(User user) {
		return "Bearer " + tokenService.issueToken(user).accessToken();
	}
}
