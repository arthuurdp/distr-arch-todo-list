package com.todolist.worker.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import com.todolist.contracts.config.MessagingConfiguration;
    
@Configuration
@Import(MessagingConfiguration.class)
public class MessagingConfig {
}
