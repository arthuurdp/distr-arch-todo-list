package com.todolist.api.todo.mapper;

import org.springframework.stereotype.Component;

import com.todolist.api.todo.Todo;
import com.todolist.api.todo.dto.TodoResponse;

@Component
public class TodoMapper {
    public TodoResponse toResponse(Todo todo) {
        return new TodoResponse(
                todo.getId(),
                todo.getOwner().getId(),
                todo.getTitle(),
                todo.getDescription(),
                todo.isCompleted(),
                todo.getDueDate(),
                todo.getCreatedAt(),
                todo.getUpdatedAt()
        );
    }
}
