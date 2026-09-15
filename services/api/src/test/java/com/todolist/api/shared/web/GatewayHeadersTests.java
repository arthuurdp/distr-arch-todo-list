package com.todolist.api.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import com.todolist.api.TestcontainersConfiguration;
import com.todolist.api.support.AuthTestSupport;
import com.todolist.api.user.User;
import com.todolist.api.user.enums.Role;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AuthTestSupport.class })
class GatewayHeadersTests {
	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private AuthTestSupport auth;

	@BeforeEach
	void setUp() {
		auth.resetDatabase();
	}

	@Test
	void everyResponseIdentifiesTheInstance() {
		assertThat(mvc.get().uri("/actuator/health"))
			.hasStatusOk()
			.hasHeader(InstanceIdFilter.HEADER_NAME, "local");
		assertThat(mvc.get().uri("/api/todos"))
			.hasStatus(HttpStatus.UNAUTHORIZED)
			.hasHeader(InstanceIdFilter.HEADER_NAME, "local");
	}

	@Test
	void locationHeaderPointsToTheGatewayAddress() {
		User user = auth.createUser("test@gmail.com", Role.USER);

		MvcTestResult created = mvc.post()
			.uri("/api/todos")
			.header(HttpHeaders.AUTHORIZATION, auth.bearerTokenFor(user))
			.header("X-Forwarded-Host", "localhost:8080")
			.header("X-Forwarded-Proto", "http")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": "Test todo"}
					""")
			.exchange();

		assertThat(created).hasStatus(HttpStatus.CREATED);
		assertThat(created.getResponse().getHeader(HttpHeaders.LOCATION)).startsWith("http://localhost:8080/api/todos/");
	}
}
