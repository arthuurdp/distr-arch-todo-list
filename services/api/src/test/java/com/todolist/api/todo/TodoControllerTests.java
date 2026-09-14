package com.todolist.api.todo;

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
import com.todolist.api.user.enums.Role;
import com.todolist.api.user.User;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AuthTestSupport.class })
class TodoControllerTests {
	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private TodoRepository todoRepository;

	@Autowired
	private AuthTestSupport auth;

	private User user;
	private String userToken;

	@BeforeEach
	void setUp() {
		auth.resetDatabase();
		user = auth.createUser("test@gmail.com", Role.USER);
		userToken = auth.bearerTokenFor(user);
	}

	@Test
	void requiresAuthentication() {
		assertThat(mvc.get().uri("/api/todos"))
			.hasStatus(HttpStatus.UNAUTHORIZED)
			.bodyJson()
			.extractingPath("$.title")
			.asString()
			.isEqualTo("Unauthorized");
	}

	@Test
	void rejectsInvalidToken() {
		assertThat(mvc.get().uri("/api/todos").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-valid-token"))
			.hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void createsTodoOwnedByCurrentUserAndFetchesItFromLocation() {
		MvcTestResult created = mvc.post()
			.uri("/api/todos")
			.header(HttpHeaders.AUTHORIZATION, userToken)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": "Test todo", "description": "Test description", "dueDate": "2026-09-30"}
					""")
			.exchange();

		assertThat(created).hasStatus(HttpStatus.CREATED);
		assertThat(created).bodyJson().extractingPath("$.ownerId").asString().isEqualTo(user.getId().toString());

		String location = created.getResponse().getHeader("Location");
		assertThat(mvc.get().uri(location).header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.dueDate")
			.asString()
			.isEqualTo("2026-09-30");
	}

	@Test
	void listsOnlyOwnTodosFilteredByCompletion() {
		User otherUser = auth.createUser("test1@gmail.com", Role.USER);
		Todo done = new Todo(user, "Test todo done", null, null);
		done.update("Test todo done", null, true, null);
		todoRepository.save(done);
		todoRepository.save(new Todo(user, "Test todo pending", null, null));
		todoRepository.save(new Todo(otherUser, "Test1 todo", null, null));

		assertThat(mvc.get().uri("/api/todos?completed=true").header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.asNumber()
			.isEqualTo(1);
		assertThat(mvc.get().uri("/api/todos").header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.asNumber()
			.isEqualTo(2);
	}

	@Test
	void updatesTodo() {
		Todo todo = todoRepository.save(new Todo(user, "Test todo", null, null));

		assertThat(mvc.put()
			.uri("/api/todos/{id}", todo.getId())
			.header(HttpHeaders.AUTHORIZATION, userToken)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": "Test todo updated", "completed": true}
					"""))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.completed")
			.asBoolean()
			.isTrue();
	}

	@Test
	void deletesTodo() {
		Todo todo = todoRepository.save(new Todo(user, "Test todo", null, null));

		assertThat(mvc.delete().uri("/api/todos/{id}", todo.getId()).header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.NO_CONTENT);
		assertThat(mvc.get().uri("/api/todos/{id}", todo.getId()).header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void rejectsInvalidTodoWithFieldErrors() {
		assertThat(mvc.post()
			.uri("/api/todos")
			.header(HttpHeaders.AUTHORIZATION, userToken)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": ""}
					"""))
			.hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.hasPath("$.errors.title");
	}

	@Test
	void returnsNotFoundProblemForUnknownTodo() {
		assertThat(mvc.get()
			.uri("/api/todos/{id}", "00000000-0000-0000-0000-000000000000")
			.header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.title")
			.asString()
			.isEqualTo("Resource not found");
	}

	@Test
	void rejectsSortPropertiesOutsideAllowList() {
		assertThat(mvc.get().uri("/api/todos?sort=owner.passwordHash").header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.title")
			.asString()
			.isEqualTo("Invalid sort property");
		assertThat(mvc.get().uri("/api/todos?sort={sort}", "[\"string\"]").header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void userCannotReadUpdateOrDeleteAnotherUsersTodo() {
		User otherUser = auth.createUser("test1@gmail.com", Role.USER);
		Todo otherUsersTodo = todoRepository.save(new Todo(otherUser, "Test1 todo", null, null));

		assertThat(mvc.get().uri("/api/todos/{id}", otherUsersTodo.getId()).header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.NOT_FOUND);
		assertThat(mvc.put()
			.uri("/api/todos/{id}", otherUsersTodo.getId())
			.header(HttpHeaders.AUTHORIZATION, userToken)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": "Test todo updated", "completed": true}
					"""))
			.hasStatus(HttpStatus.NOT_FOUND);
		assertThat(mvc.delete().uri("/api/todos/{id}", otherUsersTodo.getId()).header(HttpHeaders.AUTHORIZATION, userToken))
			.hasStatus(HttpStatus.NOT_FOUND);

		assertThat(todoRepository.findById(otherUsersTodo.getId())).get()
			.extracting(Todo::getTitle)
			.isEqualTo("Test1 todo");
	}

	@Test
	void adminSeesAndManagesTodosOfAllUsers() {
		User admin = auth.createUser("test2@gmail.com", Role.ADMIN);
		String adminToken = auth.bearerTokenFor(admin);
		User otherUser = auth.createUser("test1@gmail.com", Role.USER);
		Todo userTodo = todoRepository.save(new Todo(user, "Test todo", null, null));
		todoRepository.save(new Todo(otherUser, "Test1 todo", null, null));

		assertThat(mvc.get().uri("/api/todos").header(HttpHeaders.AUTHORIZATION, adminToken))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.asNumber()
			.isEqualTo(2);
		assertThat(mvc.delete().uri("/api/todos/{id}", userTodo.getId()).header(HttpHeaders.AUTHORIZATION, adminToken))
			.hasStatus(HttpStatus.NO_CONTENT);
	}
}
