package com.todolist.api.user;

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

import com.todolist.api.TestcontainersConfiguration;
import com.todolist.api.support.AuthTestSupport;
import com.todolist.api.todo.Todo;
import com.todolist.api.todo.TodoRepository;
import com.todolist.api.user.enums.Role;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AuthTestSupport.class })
class AdminUserControllerTests {
	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private AuthTestSupport auth;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TodoRepository todoRepository;

	private User admin;
	private String adminToken;
	private User user;
	private String userToken;

	@BeforeEach
	void setUp() {
		auth.resetDatabase();
		admin = auth.createUser("test@gmail.com", Role.ADMIN);
		adminToken = auth.bearerTokenFor(admin);
		user = auth.createUser("test1@gmail.com", Role.USER);
		userToken = auth.bearerTokenFor(user);
	}

	@Test
	void regularUserCannotAccessAdminEndpoints() {
		assertThat(mvc.get().uri("/api/admin/users").header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.FORBIDDEN)
			.bodyJson()
			.extractingPath("$.title")
			.asString()
			.isEqualTo("Forbidden");
	}

	@Test
	void adminListsAllUsers() {
		assertThat(mvc.get().uri("/api/admin/users").header(HttpHeaders.AUTHORIZATION, adminToken))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.asNumber()
			.isEqualTo(3);
	}

	@Test
	void adminPromotesUser() {
		assertThat(mvc.patch()
			.uri("/api/admin/users/{id}/role", user.getId())
			.header(HttpHeaders.AUTHORIZATION, adminToken)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"role": "ADMIN"}
					"""))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.role")
			.asString()
			.isEqualTo("ADMIN");
	}

	@Test
	void adminCannotChangeOwnRole() {
		assertThat(mvc.patch()
			.uri("/api/admin/users/{id}/role", admin.getId())
			.header(HttpHeaders.AUTHORIZATION, adminToken)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"role": "USER"}
					"""))
			.hasStatus(HttpStatus.UNPROCESSABLE_ENTITY);
	}

	@Test
	void adminDeletesUserTogetherWithTheirTodos() {
		todoRepository.save(new Todo(user, "Test todo", null, null));

		assertThat(mvc.delete().uri("/api/admin/users/{id}", user.getId()).header(HttpHeaders.AUTHORIZATION, adminToken))
			.hasStatus(HttpStatus.NO_CONTENT);
		assertThat(userRepository.existsById(user.getId())).isFalse();
		assertThat(todoRepository.count()).isZero();
	}

	@Test
	void adminCannotDeleteOwnAccount() {
		assertThat(mvc.delete().uri("/api/admin/users/{id}", admin.getId()).header(HttpHeaders.AUTHORIZATION, adminToken))
			.hasStatus(HttpStatus.UNPROCESSABLE_ENTITY);
	}
}
