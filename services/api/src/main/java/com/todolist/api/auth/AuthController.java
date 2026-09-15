package com.todolist.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.todolist.api.auth.dto.ForgotPasswordRequest;
import com.todolist.api.auth.dto.LoginRequest;
import com.todolist.api.auth.dto.RegisterRequest;
import com.todolist.api.auth.dto.ResetPasswordRequest;
import com.todolist.api.auth.dto.TokenResponse;
import com.todolist.api.shared.security.AuthenticatedUser;
import com.todolist.api.user.UserService;
import com.todolist.api.user.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;
	private final PasswordResetService passwordResetService;
	private final UserService userService;

	public AuthController(AuthService authService, PasswordResetService passwordResetService, UserService userService) {
		this.authService = authService;
		this.passwordResetService = passwordResetService;
		this.userService = userService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public UserResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public TokenResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	public UserResponse me(@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return userService.findUserById(currentUser.id());
	}

	@PostMapping("/forgot-password")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		passwordResetService.requestReset(request);
	}

	@PostMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		passwordResetService.resetPassword(request);
	}
}
