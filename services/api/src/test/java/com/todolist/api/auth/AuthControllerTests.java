package com.todolist.api.auth;

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

import com.jayway.jsonpath.JsonPath;
import com.todolist.api.TestcontainersConfiguration;
import com.todolist.api.support.AuthTestSupport;
import com.todolist.api.user.enums.Role;
import com.todolist.api.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AuthTestSupport.class })
class AuthControllerTests {
	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private AuthTestSupport auth;

	@Autowired
	private UserRepository userRepository;

	@BeforeEach
	void setUp() {
		auth.resetDatabase();
	}

	@Test
	void registersNewAccountAlwaysAsUser() {
		MvcTestResult result = mvc.post()
			.uri("/api/auth/register")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"name": "Test", "email": "Test@Gmail.com", "password": "Password123!", "role": "ADMIN"}
					""")
			.exchange();

		assertThat(result).hasStatus(HttpStatus.CREATED);
		assertThat(result).bodyJson().extractingPath("$.role").asString().isEqualTo("USER");
		assertThat(result).bodyJson().extractingPath("$.email").asString().isEqualTo("test@gmail.com");
		assertThat(result).bodyJson().doesNotHavePath("$.passwordHash");
		assertThat(userRepository.findByEmail("test@gmail.com")).isPresent();
	}

	@Test
	void rejectsDuplicateEmail() {
		auth.createUser("test@gmail.com", Role.USER);

		assertThat(mvc.post()
			.uri("/api/auth/register")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"name": "Test", "email": "TEST@gmail.com", "password": "Password123!"}
					"""))
			.hasStatus(HttpStatus.CONFLICT);
	}

	@Test
	void rejectsShortPassword() {
		assertThat(mvc.post()
			.uri("/api/auth/register")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"name": "Test1", "email": "test1@gmail.com", "password": "short"}
					"""))
			.hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.hasPath("$.errors.password");
	}

	@Test
	void logsInAndReturnsTokenAcceptedByProtectedEndpoints() throws Exception {
		auth.createUser("test2@gmail.com", Role.USER);

		MvcTestResult login = mvc.post()
			.uri("/api/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "test2@gmail.com", "password": "Password123!"}
					""")
			.exchange();

		assertThat(login).hasStatusOk();
		assertThat(login).bodyJson().extractingPath("$.tokenType").asString().isEqualTo("Bearer");

		String accessToken = JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");
		assertThat(mvc.get().uri("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.email")
			.asString()
			.isEqualTo("test2@gmail.com");
	}

	@Test
	void wrongPasswordAndUnknownEmailGetTheSameResponse() {
		auth.createUser("test3@gmail.com", Role.USER);

		assertThat(mvc.post()
			.uri("/api/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "test3@gmail.com", "password": "WrongPassword1!"}
					"""))
			.hasStatus(HttpStatus.UNAUTHORIZED)
			.bodyJson()
			.extractingPath("$.detail")
			.asString()
			.isEqualTo("Invalid email or password");
		assertThat(mvc.post()
			.uri("/api/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "test4@gmail.com", "password": "WrongPassword1!"}
					"""))
			.hasStatus(HttpStatus.UNAUTHORIZED)
			.bodyJson()
			.extractingPath("$.detail")
			.asString()
			.isEqualTo("Invalid email or password");
	}

	@Test
	void seededAdministratorCanLogIn() {
		assertThat(mvc.post()
			.uri("/api/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s", "password": "%s"}
					""".formatted(AuthTestSupport.SEEDED_ADMIN_EMAIL, AuthTestSupport.SEEDED_ADMIN_PASSWORD)))
			.hasStatusOk();
	}
}
