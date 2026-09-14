package com.todolist.api.user;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.todolist.api.shared.security.AuthenticatedUser;
import com.todolist.api.shared.web.PageResponse;
import com.todolist.api.user.dto.UpdateUserRoleRequest;
import com.todolist.api.user.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
	private final UserService userService;

	public AdminUserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	public PageResponse<UserResponse> findAllUsers(
			@ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return userService.findAllUsers(pageable);
	}

	@PatchMapping("/{id}/role")
	public UserResponse changeRole(@AuthenticationPrincipal AuthenticatedUser currentUser, @PathVariable UUID id,
			@Valid @RequestBody UpdateUserRoleRequest request) {
		return userService.changeRole(currentUser, id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal AuthenticatedUser currentUser, @PathVariable UUID id) {
		userService.deleteUser(currentUser, id);
	}
}
