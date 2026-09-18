package com.todolist.worker.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.todolist.contracts.NotificationTopology;
import com.todolist.contracts.event.PasswordResetRequestedEvent;
import com.todolist.contracts.event.UserRegisteredEvent;
import com.todolist.worker.email.EmailService;

@Component
public class NotificationListener {
	private final EmailService emailService;

	public NotificationListener(EmailService emailService) {
		this.emailService = emailService;
	}

	@RabbitListener(queues = NotificationTopology.WELCOME_EMAIL_QUEUE)
	void onUserRegistered(UserRegisteredEvent event) {
		emailService.sendWelcomeEmail(event);
	}

	@RabbitListener(queues = NotificationTopology.PASSWORD_RESET_EMAIL_QUEUE)
	void onPasswordResetRequested(PasswordResetRequestedEvent event) {
		emailService.sendPasswordResetEmail(event);
	}
}
