package com.todolist.api.shared.security;

import java.util.UUID;

import com.todolist.api.user.enums.Role;

public record AuthenticatedUser(UUID id, String email, Role role) {
	public boolean isAdmin() {
		return role == Role.ADMIN;
	}
}
