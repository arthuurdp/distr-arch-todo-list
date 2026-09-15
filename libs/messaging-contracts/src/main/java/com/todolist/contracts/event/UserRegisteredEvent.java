package com.todolist.contracts.event;

import java.util.UUID;

public record UserRegisteredEvent(UUID userId, String name, String email) {
}
