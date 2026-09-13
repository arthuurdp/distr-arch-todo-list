package com.todolist.api.shared.exception;

public class ResourceNotFoundException extends RuntimeException {
	public ResourceNotFoundException(String resource, Object id) {
		super(resource + " " + id + " not found");
	}
}
