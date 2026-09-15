package com.todolist.worker.email;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import com.todolist.contracts.event.PasswordResetRequestedEvent;
import com.todolist.contracts.event.UserRegisteredEvent;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final ITemplateEngine templateEngine;
	private final String from;

	public EmailService(JavaMailSender mailSender, ITemplateEngine templateEngine,
			@Value("${app.mail.from}") String from) {
		this.mailSender = mailSender;
		this.templateEngine = templateEngine;
		this.from = from;
	}

	public void sendWelcomeEmail(UserRegisteredEvent event) {
		Context context = new Context();
		context.setVariable("name", event.name());

		send(event.email(), "Welcome to Todo List", "email/welcome", context);
		log.info("Welcome email sent to user {}", event.userId());
	}

	public void sendPasswordResetEmail(PasswordResetRequestedEvent event) {
		Instant now = Instant.now();
		if (!now.isBefore(event.expiresAt())) {
			log.warn("Skipping password reset email for user {}: code already expired", event.userId());
			return;
		}

		Context context = new Context();
		context.setVariable("name", event.name());
		context.setVariable("code", event.code());
		context.setVariable("expiresInMinutes", Math.max(1, Duration.between(now, event.expiresAt()).toMinutes()));

		send(event.email(), "Your password reset code", "email/password-reset", context);
		log.info("Password reset email sent to user {}", event.userId());
	}

	private void send(String to, String subject, String template, Context context) {
		String html = templateEngine.process(template, context);
		MimeMessage message = mailSender.createMimeMessage();
		try {
			MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
			helper.setFrom(from);
			helper.setTo(to);
			helper.setSubject(subject);
			helper.setText(html, true);
		} catch (MessagingException ex) {
			throw new MailPreparationException("Could not build email to " + to, ex);
		}
		mailSender.send(message);
	}
}
