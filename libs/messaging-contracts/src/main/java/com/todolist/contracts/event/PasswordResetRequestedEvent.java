package com.todolist.contracts.event;

import java.time.Instant;
import java.util.UUID;

public record PasswordResetRequestedEvent(UUID userId, String name, String email, String code, Instant expiresAt) {
}
