package com.todolist.api.todo;

import java.net.URI;
import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.todolist.api.shared.security.AuthenticatedUser;
import com.todolist.api.shared.web.PageResponse;
import com.todolist.api.todo.dto.CreateTodoRequest;
import com.todolist.api.todo.dto.TodoResponse;
import com.todolist.api.todo.dto.UpdateTodoRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/todos")
public class TodoController {
	private final TodoService todoService;

	public TodoController(TodoService todoService) {
		this.todoService = todoService;
	}

	@GetMapping
	public PageResponse<TodoResponse> list(@AuthenticationPrincipal AuthenticatedUser currentUser,
			@RequestParam(required = false) Boolean completed,
			@ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return todoService.findAllTodos(currentUser, completed, pageable);
	}

	@GetMapping("/{id}")
	public TodoResponse get(@AuthenticationPrincipal AuthenticatedUser currentUser, @PathVariable UUID id) {
		return todoService.findTodoById(currentUser, id);
	}

	@PostMapping
	public ResponseEntity<TodoResponse> create(@AuthenticationPrincipal AuthenticatedUser currentUser,
			@Valid @RequestBody CreateTodoRequest request) {
		TodoResponse created = todoService.createTodo(currentUser, request);
		URI location = ServletUriComponentsBuilder.fromCurrentRequest()
				.path("/{id}")
				.buildAndExpand(created.id())
				.toUri();
		return ResponseEntity.created(location).body(created);
	}

	@PutMapping("/{id}")
	public TodoResponse update(@AuthenticationPrincipal AuthenticatedUser currentUser, @PathVariable UUID id,
			@Valid @RequestBody UpdateTodoRequest request) {
		return todoService.updateTodo(currentUser, id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal AuthenticatedUser currentUser, @PathVariable UUID id) {
		todoService.deleteTodo(currentUser, id);
	}
}
