package com.todolist.api.shared.web;

import java.util.Collection;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.todolist.api.shared.exception.InvalidSortPropertyException;

public final class SortValidator {
	private SortValidator() {
	}

	public static void validate(Pageable pageable, Collection<String> allowedProperties) {
		for (Sort.Order order : pageable.getSort()) {
			if (!allowedProperties.contains(order.getProperty())) {
				throw new InvalidSortPropertyException(order.getProperty(), allowedProperties);
			}
		}
	}
}
