package com.todolist.api.shared.exception;

public class InvalidPasswordResetCodeException extends RuntimeException {
	public InvalidPasswordResetCodeException() {
		super("Invalid or expired password reset code");
	}
}
