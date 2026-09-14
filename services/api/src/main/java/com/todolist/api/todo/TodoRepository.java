package com.todolist.api.todo;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoRepository extends JpaRepository<Todo, UUID> {
	Page<Todo> findByCompleted(boolean completed, Pageable pageable);

	Page<Todo> findByOwnerId(UUID ownerId, Pageable pageable);

	Page<Todo> findByOwnerIdAndCompleted(UUID ownerId, boolean completed, Pageable pageable);

	Optional<Todo> findByIdAndOwnerId(UUID id, UUID ownerId);
}
