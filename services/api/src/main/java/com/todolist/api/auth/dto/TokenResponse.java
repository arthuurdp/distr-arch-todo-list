package com.todolist.api.auth.dto;

public record TokenResponse(
		String accessToken,
		String tokenType,
		long expiresIn) {
}
