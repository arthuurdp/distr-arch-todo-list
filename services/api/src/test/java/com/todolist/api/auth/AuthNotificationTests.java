package com.todolist.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeFalse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import com.todolist.api.TestcontainersConfiguration;
import com.todolist.api.support.AuthTestSupport;
import com.todolist.api.user.enums.Role;
import com.todolist.contracts.NotificationTopology;
import com.todolist.contracts.event.PasswordResetRequestedEvent;
import com.todolist.contracts.event.UserRegisteredEvent;

/**
 * Covers the producer side: the API publishes the right events to RabbitMQ, and the password reset flow works with
 * the code carried by the published event. The worker is not involved; messages are read straight from the queues.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AuthTestSupport.class })
class AuthNotificationTests {
	private static final String EMAIL = "test@gmail.com";
	private static final String NEW_PASSWORD = "NewPassword123!";

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private AuthTestSupport auth;

	@Autowired
	private RabbitTemplate rabbitTemplate;

	@Autowired
	private AmqpAdmin amqpAdmin;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@BeforeEach
	void setUp() {
		auth.resetDatabase();
		amqpAdmin.purgeQueue(NotificationTopology.WELCOME_EMAIL_QUEUE);
		amqpAdmin.purgeQueue(NotificationTopology.PASSWORD_RESET_EMAIL_QUEUE);
	}

	@Test
	void registrationPublishesWelcomeEvent() {
		assertThat(mvc.post()
			.uri("/api/auth/register")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"name": "Test", "email": "test@gmail.com", "password": "Password123!"}
					"""))
			.hasStatus(HttpStatus.CREATED);

		Object message = rabbitTemplate.receiveAndConvert(NotificationTopology.WELCOME_EMAIL_QUEUE, 5_000);
		assertThat(message).isInstanceOf(UserRegisteredEvent.class);
		UserRegisteredEvent event = (UserRegisteredEvent) message;
		assertThat(event.email()).isEqualTo(EMAIL);
		assertThat(event.name()).isEqualTo("Test");
	}

	@Test
	void forgotPasswordPublishesCodeAndResetChangesThePassword() {
		auth.createUser(EMAIL, Role.USER);

		assertThat(forgotPassword(EMAIL)).hasStatus(HttpStatus.ACCEPTED);
		PasswordResetRequestedEvent event = receivePasswordResetEvent();
		assertThat(event.email()).isEqualTo(EMAIL);
		assertThat(event.code()).matches("\\d{6}");

		assertThat(resetPassword(EMAIL, event.code(), NEW_PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);
		assertThat(login(EMAIL, NEW_PASSWORD)).hasStatusOk();
		assertThat(login(EMAIL, AuthTestSupport.DEFAULT_PASSWORD)).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void unknownEmailGetsTheSameResponseAndNoCodeIsSent() {
		assertThat(forgotPassword("test1@gmail.com")).hasStatus(HttpStatus.ACCEPTED);
		assertThat(rabbitTemplate.receiveAndConvert(NotificationTopology.PASSWORD_RESET_EMAIL_QUEUE, 1_000)).isNull();
	}

	@Test
	void wrongCodesConsumeAttemptsUntilTheCodeIsBlocked() {
		auth.createUser(EMAIL, Role.USER);
		forgotPassword(EMAIL);
		PasswordResetRequestedEvent event = receivePasswordResetEvent();
		String wrongCode = event.code().equals("000000") ? "111111" : "000000";

		for (int attempt = 1; attempt <= PasswordResetService.MAX_ATTEMPTS; attempt++) {
			assertThat(resetPassword(EMAIL, wrongCode, NEW_PASSWORD))
				.hasStatus(HttpStatus.BAD_REQUEST)
				.bodyJson()
				.extractingPath("$.title")
				.asString()
				.isEqualTo("Invalid password reset code");
		}

		assertThat(resetPassword(EMAIL, event.code(), NEW_PASSWORD)).hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void codeIsSingleUseAndANewRequestInvalidatesThePreviousCode() {
		auth.createUser(EMAIL, Role.USER);
		forgotPassword(EMAIL);
		PasswordResetRequestedEvent firstRequest = receivePasswordResetEvent();
		forgotPassword(EMAIL);
		PasswordResetRequestedEvent secondRequest = receivePasswordResetEvent();
		assumeFalse(firstRequest.code().equals(secondRequest.code()), "both random codes happened to be equal");

		assertThat(resetPassword(EMAIL, firstRequest.code(), NEW_PASSWORD)).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(resetPassword(EMAIL, secondRequest.code(), NEW_PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);
		assertThat(resetPassword(EMAIL, secondRequest.code(), NEW_PASSWORD)).hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void expiredCodeIsRejected() {
		auth.createUser(EMAIL, Role.USER);
		forgotPassword(EMAIL);
		PasswordResetRequestedEvent event = receivePasswordResetEvent();
		jdbcTemplate.update("UPDATE password_reset_codes SET expires_at = NOW() - INTERVAL '1 minute'");

		assertThat(resetPassword(EMAIL, event.code(), NEW_PASSWORD)).hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void resetRequestIsValidated() {
		assertThat(resetPassword(EMAIL, "12ab", "short"))
			.hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.hasPath("$.errors.code")
			.hasPath("$.errors.newPassword");
	}

	private MvcTestResult forgotPassword(String email) {
		return mvc.post()
			.uri("/api/auth/forgot-password")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s"}
					""".formatted(email))
			.exchange();
	}

	private MvcTestResult resetPassword(String email, String code, String newPassword) {
		return mvc.post()
			.uri("/api/auth/reset-password")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s", "code": "%s", "newPassword": "%s"}
					""".formatted(email, code, newPassword))
			.exchange();
	}

	private MvcTestResult login(String email, String password) {
		return mvc.post()
			.uri("/api/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s", "password": "%s"}
					""".formatted(email, password))
			.exchange();
	}

	private PasswordResetRequestedEvent receivePasswordResetEvent() {
		Object message = rabbitTemplate.receiveAndConvert(NotificationTopology.PASSWORD_RESET_EMAIL_QUEUE, 5_000);
		assertThat(message).isInstanceOf(PasswordResetRequestedEvent.class);
		return (PasswordResetRequestedEvent) message;
	}
}
