package com.todolist.api.todo.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TodoResponse(
		UUID id,
		String title,
		String description,
		boolean completed,
		LocalDate dueDate,
		Instant createdAt,
		Instant updatedAt) {
}
