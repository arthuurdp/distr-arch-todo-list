package com.todolist.worker.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration(proxyBeanMethods = false)
public class CapturingMailSenderConfiguration {
	@Bean
	CapturingMailSender capturingMailSender() {
		return new CapturingMailSender();
	}
}
