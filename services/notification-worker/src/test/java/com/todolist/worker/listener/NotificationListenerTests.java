package com.todolist.worker.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.todolist.contracts.NotificationTopology;
import com.todolist.contracts.event.PasswordResetRequestedEvent;
import com.todolist.contracts.event.UserRegisteredEvent;
import com.todolist.worker.TestcontainersConfiguration;
import com.todolist.worker.support.CapturingMailSender;
import com.todolist.worker.support.CapturingMailSenderConfiguration;

import jakarta.mail.internet.MimeMessage;

/**
 * Covers the consumer side against a real RabbitMQ: events published to the exchange become emails, and a message
 * that keeps failing ends up in the dead-letter queue.
 */
@SpringBootTest(properties = "spring.rabbitmq.listener.simple.retry.initial-interval=100ms")
@Import({ TestcontainersConfiguration.class, CapturingMailSenderConfiguration.class })
class NotificationListenerTests {
	@Autowired
	private RabbitTemplate rabbitTemplate;

	@Autowired
	private AmqpAdmin amqpAdmin;

	@Autowired
	private CapturingMailSender mailSender;

	@BeforeEach
	void setUp() {
		mailSender.reset();
		amqpAdmin.purgeQueue(NotificationTopology.WELCOME_EMAIL_QUEUE);
		amqpAdmin.purgeQueue(NotificationTopology.PASSWORD_RESET_EMAIL_QUEUE);
		amqpAdmin.purgeQueue(NotificationTopology.WELCOME_EMAIL_DEAD_LETTER_QUEUE);
		amqpAdmin.purgeQueue(NotificationTopology.PASSWORD_RESET_EMAIL_DEAD_LETTER_QUEUE);
	}

	@Test
	void sendsWelcomeEmailWhenUserRegisters() throws Exception {
		rabbitTemplate.convertAndSend(NotificationTopology.EXCHANGE, NotificationTopology.USER_REGISTERED_ROUTING_KEY,
				new UserRegisteredEvent(UUID.randomUUID(), "Test", "test@gmail.com"));

		MimeMessage email = awaitSingleEmail();
		assertThat(email.getAllRecipients()[0].toString()).isEqualTo("test@gmail.com");
		assertThat(email.getSubject()).isEqualTo("Welcome to Todo List");
		assertThat((String) email.getContent()).contains("Welcome, <span>Test</span>!");
	}

	@Test
	void sendsPasswordResetEmailWithTheCode() throws Exception {
		rabbitTemplate.convertAndSend(NotificationTopology.EXCHANGE,
				NotificationTopology.PASSWORD_RESET_REQUESTED_ROUTING_KEY,
				new PasswordResetRequestedEvent(UUID.randomUUID(), "Test", "test@gmail.com", "123456",
						Instant.now().plus(Duration.ofMinutes(15))));

		MimeMessage email = awaitSingleEmail();
		assertThat(email.getSubject()).isEqualTo("Your password reset code");
		assertThat((String) email.getContent()).contains("123456");
	}

	@Test
	void skipsPasswordResetEmailWhenTheCodeHasAlreadyExpired() {
		rabbitTemplate.convertAndSend(NotificationTopology.EXCHANGE,
				NotificationTopology.PASSWORD_RESET_REQUESTED_ROUTING_KEY,
				new PasswordResetRequestedEvent(UUID.randomUUID(), "Test", "test@gmail.com", "123456",
						Instant.now().minus(Duration.ofMinutes(1))));

		await().during(Duration.ofSeconds(2))
			.atMost(Duration.ofSeconds(3))
			.until(() -> mailSender.sentMessages().isEmpty());
	}

	@Test
	void movesMessageToDeadLetterQueueWhenEmailKeepsFailing() {
		mailSender.simulateUnavailable();

		rabbitTemplate.convertAndSend(NotificationTopology.EXCHANGE, NotificationTopology.USER_REGISTERED_ROUTING_KEY,
				new UserRegisteredEvent(UUID.randomUUID(), "Test", "test@gmail.com"));

		Object deadLetter = await().atMost(Duration.ofSeconds(15))
			.until(() -> rabbitTemplate.receiveAndConvert(NotificationTopology.WELCOME_EMAIL_DEAD_LETTER_QUEUE),
					message -> message != null);
		assertThat(deadLetter).isInstanceOf(UserRegisteredEvent.class);
		assertThat(mailSender.sentMessages()).isEmpty();
	}

	private MimeMessage awaitSingleEmail() {
		await().atMost(Duration.ofSeconds(10)).until(() -> mailSender.sentMessages().size() == 1);
		return mailSender.sentMessages().get(0);
	}
}
