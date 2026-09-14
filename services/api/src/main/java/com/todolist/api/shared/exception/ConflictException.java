package com.todolist.api.shared.exception;

public class ConflictException extends RuntimeException {
	public ConflictException(String message) {
		super(message);
	}
}
