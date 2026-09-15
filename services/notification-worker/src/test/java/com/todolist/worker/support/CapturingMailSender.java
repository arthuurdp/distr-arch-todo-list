package com.todolist.worker.support;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import jakarta.mail.internet.MimeMessage;

/**
 * Keeps sent emails in memory instead of talking to an SMTP server, and can simulate the server being down.
 */
public class CapturingMailSender extends JavaMailSenderImpl {
	private final List<MimeMessage> sentMessages = new CopyOnWriteArrayList<>();
	private volatile boolean unavailable;

	@Override
	protected void doSend(MimeMessage[] mimeMessages, Object[] originalMessages) {
		if (unavailable) {
			throw new MailSendException("SMTP server unavailable");
		}
		sentMessages.addAll(List.of(mimeMessages));
	}

	public List<MimeMessage> sentMessages() {
		return sentMessages;
	}

	public void simulateUnavailable() {
		this.unavailable = true;
	}

	public void reset() {
		sentMessages.clear();
		unavailable = false;
	}
}
