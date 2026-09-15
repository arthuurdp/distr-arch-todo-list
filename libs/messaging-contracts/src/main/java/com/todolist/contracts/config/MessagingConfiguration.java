package com.todolist.contracts.config;

import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.todolist.contracts.NotificationTopology;

@Configuration(proxyBeanMethods = false)
public class MessagingConfiguration {
	private static final String EVENTS_PACKAGE = "com.todolist.contracts.event";

	@Bean
	Declarables notificationTopology() {
		DirectExchange exchange = new DirectExchange(NotificationTopology.EXCHANGE);
		DirectExchange deadLetterExchange = new DirectExchange(NotificationTopology.DEAD_LETTER_EXCHANGE);

		Queue welcomeEmails = queueWithDeadLetters(NotificationTopology.WELCOME_EMAIL_QUEUE);
		Queue passwordResetEmails = queueWithDeadLetters(NotificationTopology.PASSWORD_RESET_EMAIL_QUEUE);
		Queue welcomeEmailsDeadLetters = QueueBuilder.durable(NotificationTopology.WELCOME_EMAIL_DEAD_LETTER_QUEUE).build();
		Queue passwordResetEmailsDeadLetters = QueueBuilder.durable(NotificationTopology.PASSWORD_RESET_EMAIL_DEAD_LETTER_QUEUE).build();

		return new Declarables(
				exchange,
				deadLetterExchange,
				welcomeEmails,
				passwordResetEmails,
				welcomeEmailsDeadLetters,
				passwordResetEmailsDeadLetters,
				BindingBuilder.bind(welcomeEmails).to(exchange).with(NotificationTopology.USER_REGISTERED_ROUTING_KEY),
				BindingBuilder.bind(passwordResetEmails).to(exchange)
					.with(NotificationTopology.PASSWORD_RESET_REQUESTED_ROUTING_KEY),
				BindingBuilder.bind(welcomeEmailsDeadLetters).to(deadLetterExchange)
					.with(NotificationTopology.USER_REGISTERED_ROUTING_KEY),
				BindingBuilder.bind(passwordResetEmailsDeadLetters).to(deadLetterExchange)
					.with(NotificationTopology.PASSWORD_RESET_REQUESTED_ROUTING_KEY));
	}

	@Bean
	MessageConverter messageConverter() {
		return new JacksonJsonMessageConverter(EVENTS_PACKAGE);
	}

	private static Queue queueWithDeadLetters(String name) {
		return QueueBuilder.durable(name)
			.deadLetterExchange(NotificationTopology.DEAD_LETTER_EXCHANGE)
			.build();
	}
}
