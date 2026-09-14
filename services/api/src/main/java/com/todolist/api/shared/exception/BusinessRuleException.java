package com.todolist.api.shared.exception;

public class BusinessRuleException extends RuntimeException {
	public BusinessRuleException(String message) {
		super(message);
	}
}
