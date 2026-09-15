CREATE TABLE password_reset_codes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    code_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_password_reset_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_codes_user_id ON password_reset_codes (user_id);
