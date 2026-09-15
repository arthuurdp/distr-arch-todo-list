package com.todolist.contracts;

public final class NotificationTopology {
	public static final String EXCHANGE = "notifications";
	public static final String DEAD_LETTER_EXCHANGE = "notifications.dlx";

	public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";
	public static final String PASSWORD_RESET_REQUESTED_ROUTING_KEY = "password-reset.requested";

	public static final String WELCOME_EMAIL_QUEUE = "email.welcome";
	public static final String PASSWORD_RESET_EMAIL_QUEUE = "email.password-reset";

	public static final String WELCOME_EMAIL_DEAD_LETTER_QUEUE = WELCOME_EMAIL_QUEUE + ".dlq";
	public static final String PASSWORD_RESET_EMAIL_DEAD_LETTER_QUEUE = PASSWORD_RESET_EMAIL_QUEUE + ".dlq";

	private NotificationTopology() {
	}
}
