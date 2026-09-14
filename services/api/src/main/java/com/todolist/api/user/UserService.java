package com.todolist.api.user;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todolist.api.shared.exception.BusinessRuleException;
import com.todolist.api.shared.exception.ResourceNotFoundException;
import com.todolist.api.shared.security.AuthenticatedUser;
import com.todolist.api.shared.web.PageResponse;
import com.todolist.api.shared.web.SortValidator;
import com.todolist.api.user.dto.UpdateUserRoleRequest;
import com.todolist.api.user.dto.UserResponse;
import com.todolist.api.user.mapper.UserMapper;

@Service
@Transactional(readOnly = true)
public class UserService {
	private static final List<String> SORTABLE_PROPERTIES = List.of("name", "email", "role", "createdAt");

	private final UserRepository userRepository;
	private final UserMapper userMapper;

	public UserService(UserRepository userRepository, UserMapper userMapper) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
	}

	public PageResponse<UserResponse> findAllUsers(Pageable pageable) {
		SortValidator.validate(pageable, SORTABLE_PROPERTIES);
		return PageResponse.from(userRepository.findAll(pageable).map(userMapper::toResponse));
	}

	public UserResponse findUserById(UUID id) {
		return userMapper.toResponse(findEntityById(id));
	}

	@Transactional
	public UserResponse changeRole(AuthenticatedUser currentUser, UUID id, UpdateUserRoleRequest request) {
		if (currentUser.id().equals(id)) {
			throw new BusinessRuleException("Administrators cannot change their own role");
		}

		User user = findEntityById(id);
		user.changeRole(request.role());
		userRepository.saveAndFlush(user);
		return userMapper.toResponse(user);
	}

	@Transactional
	public void deleteUser(AuthenticatedUser currentUser, UUID id) {
		if (currentUser.id().equals(id)) {
			throw new BusinessRuleException("Administrators cannot delete their own account");
		}
		userRepository.delete(findEntityById(id));
	}

	private User findEntityById(UUID id) {
		return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));
	}
}
