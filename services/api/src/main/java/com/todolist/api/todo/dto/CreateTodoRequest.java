package com.todolist.api.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateTodoRequest(
		@NotBlank @Size(max = 120) String title,
		@Size(max = 1000) String description,
		LocalDate dueDate) {
}
