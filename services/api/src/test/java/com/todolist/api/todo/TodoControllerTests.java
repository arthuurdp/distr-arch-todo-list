package com.todolist.api.todo;

import static org.assertj.core.api.Assertions.assertThat;

import com.todolist.api.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TodoControllerTests {

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private TodoRepository todoRepository;

	@BeforeEach
	void cleanDatabase() {
		todoRepository.deleteAll();
	}

	@Test
	void createsTodoAndFetchesItFromLocation() {
		MvcTestResult created = mvc.post()
			.uri("/api/todos")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": "Estudar RabbitMQ", "description": "filas e exchanges", "dueDate": "2026-09-30"}
					""")
			.exchange();

		assertThat(created).hasStatus(HttpStatus.CREATED);
		assertThat(created).bodyJson().extractingPath("$.title").asString().isEqualTo("Estudar RabbitMQ");
		assertThat(created).bodyJson().extractingPath("$.completed").asBoolean().isFalse();

		String location = created.getResponse().getHeader("Location");
		assertThat(mvc.get().uri(location)).hasStatusOk()
			.bodyJson()
			.extractingPath("$.dueDate")
			.asString()
			.isEqualTo("2026-09-30");
	}

	@Test
	void listsTodosFilteredByCompletion() {
		Todo done = new Todo("Done", null, null);
		done.update("Done", null, true, null);
		todoRepository.save(done);
		todoRepository.save(new Todo("Pending", null, null));

		assertThat(mvc.get().uri("/api/todos?completed=true")).hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.asNumber()
			.isEqualTo(1);
		assertThat(mvc.get().uri("/api/todos")).hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.asNumber()
			.isEqualTo(2);
	}

	@Test
	void updatesTodo() {
		Todo todo = todoRepository.save(new Todo("Old title", null, null));

		assertThat(mvc.put()
			.uri("/api/todos/{id}", todo.getId())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": "New title", "completed": true}
					""")).hasStatusOk()
			.bodyJson()
			.extractingPath("$.completed")
			.asBoolean()
			.isTrue();
	}

	@Test
	void deletesTodo() {
		Todo todo = todoRepository.save(new Todo("To delete", null, null));

		assertThat(mvc.delete().uri("/api/todos/{id}", todo.getId())).hasStatus(HttpStatus.NO_CONTENT);
		assertThat(mvc.get().uri("/api/todos/{id}", todo.getId())).hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void rejectsInvalidTodoWithFieldErrors() {
		assertThat(mvc.post()
			.uri("/api/todos")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title": ""}
					""")).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.hasPath("$.errors.title");
	}

	@Test
	void returnsNotFoundProblemForUnknownTodo() {
		assertThat(mvc.get().uri("/api/todos/{id}", "00000000-0000-0000-0000-000000000000"))
			.hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.title")
			.asString()
			.isEqualTo("Resource not found");
	}

	@Test
	void rejectsUnknownSortProperty() {
		assertThat(mvc.get().uri("/api/todos?sort=password")).hasStatus(HttpStatus.BAD_REQUEST);
	}

}
