package com.todolist.api.user.mapper;

import org.springframework.stereotype.Component;

import com.todolist.api.user.User;
import com.todolist.api.user.dto.UserResponse;

@Component
public class UserMapper {
	public UserResponse toResponse(User user) {
		return new UserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getRole(),
				user.getCreatedAt());
	}
}
