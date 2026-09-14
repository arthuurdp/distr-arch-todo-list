package com.todolist.api.shared.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
	@ExceptionHandler(ResourceNotFoundException.class)
	ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
		return problem(HttpStatus.NOT_FOUND, "Resource not found", ex.getMessage());
	}

	@ExceptionHandler(InvalidSortPropertyException.class)
	ProblemDetail handleInvalidSortProperty(InvalidSortPropertyException ex) {
		return problem(HttpStatus.BAD_REQUEST, "Invalid sort property", ex.getMessage());
	}

	@ExceptionHandler(ConflictException.class)
	ProblemDetail handleConflict(ConflictException ex) {
		return problem(HttpStatus.CONFLICT, "Conflict", ex.getMessage());
	}

	@ExceptionHandler(BusinessRuleException.class)
	ProblemDetail handleBusinessRule(BusinessRuleException ex) {
		return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Business rule violation", ex.getMessage());
	}

	@ExceptionHandler(InvalidCredentialsException.class)
	ProblemDetail handleInvalidCredentials(InvalidCredentialsException ex) {
		return problem(HttpStatus.UNAUTHORIZED, "Invalid credentials", ex.getMessage());
	}

	@ExceptionHandler(AuthenticationException.class)
	ProblemDetail handleAuthentication(AuthenticationException ex) {
		return problem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required to access this resource");
	}

	@ExceptionHandler(AccessDeniedException.class)
	ProblemDetail handleAccessDenied(AccessDeniedException ex) {
		return problem(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to access this resource");
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		ex.getBindingResult()
			.getFieldErrors()
			.forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

		ProblemDetail problem = ex.getBody();
		problem.setDetail("Request validation failed");
		problem.setProperty("errors", errors);
		return handleExceptionInternal(ex, problem, headers, status, request);
	}

	private ProblemDetail problem(HttpStatus status, String title, String detail) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
		problem.setTitle(title);
		return problem;
	}
}
