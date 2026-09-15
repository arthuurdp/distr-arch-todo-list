package com.todolist.api.notification;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.todolist.contracts.NotificationTopology;
import com.todolist.contracts.event.PasswordResetRequestedEvent;
import com.todolist.contracts.event.UserRegisteredEvent;

@Component
public class NotificationPublisher {
	private static final Logger log = LoggerFactory.getLogger(NotificationPublisher.class);

	private final RabbitTemplate rabbitTemplate;

	public NotificationPublisher(RabbitTemplate rabbitTemplate) {
		this.rabbitTemplate = rabbitTemplate;
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	void onUserRegistered(UserRegisteredEvent event) {
		publish(NotificationTopology.USER_REGISTERED_ROUTING_KEY, event, event.userId());
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	void onPasswordResetRequested(PasswordResetRequestedEvent event) {
		publish(NotificationTopology.PASSWORD_RESET_REQUESTED_ROUTING_KEY, event, event.userId());
	}

	private void publish(String routingKey, Object event, UUID userId) {
		try {
			rabbitTemplate.convertAndSend(NotificationTopology.EXCHANGE, routingKey, event);
			log.info("Published '{}' for user {}", routingKey, userId);
		} catch (AmqpException ex) {
			log.error("Could not publish '{}' for user {}", routingKey, userId, ex);
		}
	}
}
