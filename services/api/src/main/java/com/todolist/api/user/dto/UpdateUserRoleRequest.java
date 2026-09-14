package com.todolist.api.user.dto;

import com.todolist.api.user.enums.Role;

import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull Role role) {
}
