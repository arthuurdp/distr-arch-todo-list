package com.todolist.api.auth;

import java.util.Locale;

final class Emails {
	private Emails() {
	}

	/** Emails are stored trimmed and lower-case, so lookups do not depend on how the user typed them. */
	static String normalize(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
