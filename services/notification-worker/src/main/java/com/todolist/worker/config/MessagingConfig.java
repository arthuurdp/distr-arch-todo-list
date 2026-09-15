package com.todolist.worker.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import com.todolist.contracts.config.MessagingConfiguration;

/**
 * Brings in the RabbitMQ topology and JSON message converter shared with the api.
 */
@Configuration
@Import(MessagingConfiguration.class)
public class MessagingConfig {
}
