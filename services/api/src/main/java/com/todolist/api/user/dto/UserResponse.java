package com.todolist.api.user.dto;

import java.time.Instant;
import java.util.UUID;

import com.todolist.api.user.enums.Role;

public record UserResponse(
		UUID id,
		String name,
		String email,
		Role role,
		Instant createdAt) {
}
