package com.todolist.api.todo;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todolist.api.shared.exception.ResourceNotFoundException;
import com.todolist.api.shared.web.PageResponse;
import com.todolist.api.todo.dto.CreateTodoRequest;
import com.todolist.api.todo.dto.TodoResponse;
import com.todolist.api.todo.dto.UpdateTodoRequest;
import com.todolist.api.todo.mapper.TodoMapper;

@Service
@Transactional(readOnly = true)
public class TodoService {
	private final TodoRepository todoRepository;
	private final TodoMapper todoMapper;

	public TodoService(TodoRepository todoRepository, TodoMapper todoMapper) {
		this.todoRepository = todoRepository;
		this.todoMapper = todoMapper;
	}

	public PageResponse<TodoResponse> findAllTodos(Boolean completed, Pageable pageable) {
		Page<Todo> page = (completed == null)
				? todoRepository.findAll(pageable)
				: todoRepository.findByCompleted(completed, pageable);
		return PageResponse.from(page.map(todoMapper::toResponse));
	}

	public TodoResponse findTodoById(UUID id) {
		return todoMapper.toResponse(findEntityById(id));
	}

	@Transactional
	public TodoResponse createTodo(CreateTodoRequest request) {
		Todo todo = new Todo(request.title(), request.description(), request.dueDate());
		return todoMapper.toResponse(todoRepository.save(todo));
	}

	@Transactional
	public TodoResponse updateTodo(UUID id, UpdateTodoRequest request) {
		Todo todo = findEntityById(id);
		todo.update(request.title(), request.description(), request.completed(), request.dueDate());
		todoRepository.saveAndFlush(todo);
		return todoMapper.toResponse(todo);
	}

	@Transactional
	public void deleteTodo(UUID id) {
		todoRepository.delete(findEntityById(id));
	}

	private Todo findEntityById(UUID id) {
		return todoRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Todo", id));
	}

}
