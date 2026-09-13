package com.todolist.api.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateTodoRequest(
		@NotBlank @Size(max = 120) String title,
		@Size(max = 1000) String description,
		@NotNull Boolean completed,
		LocalDate dueDate) {
}
