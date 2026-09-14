ALTER TABLE todos ADD COLUMN user_id UUID;

UPDATE todos
SET user_id = (SELECT id FROM users WHERE email = 'admin@todolist.com')
WHERE user_id IS NULL;

ALTER TABLE todos
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;