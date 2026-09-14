package com.todolist.api.shared.exception;

import java.util.Collection;

public class InvalidSortPropertyException extends RuntimeException {
	public InvalidSortPropertyException(String property, Collection<String> allowedProperties) {
		super("Cannot sort by '" + property + "'. Allowed properties: " + String.join(", ", allowedProperties));
	}
}
