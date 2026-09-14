package com.todolist.api.todo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todolist.api.shared.exception.ResourceNotFoundException;
import com.todolist.api.shared.security.AuthenticatedUser;
import com.todolist.api.shared.web.PageResponse;
import com.todolist.api.shared.web.SortValidator;
import com.todolist.api.todo.dto.CreateTodoRequest;
import com.todolist.api.todo.dto.TodoResponse;
import com.todolist.api.todo.dto.UpdateTodoRequest;
import com.todolist.api.todo.mapper.TodoMapper;
import com.todolist.api.user.User;
import com.todolist.api.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class TodoService {
	private static final List<String> SORTABLE_PROPERTIES = List.of("title", "completed", "dueDate", "createdAt", "updatedAt");
	private final TodoRepository todoRepository;
	private final UserRepository userRepository;
	private final TodoMapper todoMapper;

	public TodoService(TodoRepository todoRepository, UserRepository userRepository, TodoMapper todoMapper) {
		this.todoRepository = todoRepository;
		this.userRepository = userRepository;
		this.todoMapper = todoMapper;
	}

	public PageResponse<TodoResponse> findAllTodos(AuthenticatedUser currentUser, Boolean completed,
			Pageable pageable) {
		SortValidator.validate(pageable, SORTABLE_PROPERTIES);
		Page<Todo> page = currentUser.isAdmin()
				? findTodosOfAllUsers(completed, pageable)
				: findTodosOfOwner(currentUser.id(), completed, pageable);
		return PageResponse.from(page.map(todoMapper::toResponse));
	}

	public TodoResponse findTodoById(AuthenticatedUser currentUser, UUID id) {
		return todoMapper.toResponse(findAccessibleTodo(currentUser, id));
	}

	@Transactional
	public TodoResponse createTodo(AuthenticatedUser currentUser, CreateTodoRequest request) {
		User owner = userRepository.findById(currentUser.id()).orElseThrow(() -> new ResourceNotFoundException("User", currentUser.id()));
		Todo todo = new Todo(owner, request.title(), request.description(), request.dueDate());
		return todoMapper.toResponse(todoRepository.save(todo));
	}

	@Transactional
	public TodoResponse updateTodo(AuthenticatedUser currentUser, UUID id, UpdateTodoRequest request) {
		Todo todo = findAccessibleTodo(currentUser, id);
		todo.update(request.title(), request.description(), request.completed(), request.dueDate());
		todoRepository.saveAndFlush(todo);
		return todoMapper.toResponse(todo);
	}

	@Transactional
	public void deleteTodo(AuthenticatedUser currentUser, UUID id) {
		todoRepository.delete(findAccessibleTodo(currentUser, id));
	}

	private Page<Todo> findTodosOfAllUsers(Boolean completed, Pageable pageable) {
		return (completed == null)
				? todoRepository.findAll(pageable)
				: todoRepository.findByCompleted(completed, pageable);
	}

	private Page<Todo> findTodosOfOwner(UUID ownerId, Boolean completed, Pageable pageable) {
		return (completed == null)
				? todoRepository.findByOwnerId(ownerId, pageable)
				: todoRepository.findByOwnerIdAndCompleted(ownerId, completed, pageable);
	}

	private Todo findAccessibleTodo(AuthenticatedUser currentUser, UUID id) {
		Optional<Todo> todo = currentUser.isAdmin()
				? todoRepository.findById(id)
				: todoRepository.findByIdAndOwnerId(id, currentUser.id());
		return todo.orElseThrow(() -> new ResourceNotFoundException("Todo", id));
	}
}
