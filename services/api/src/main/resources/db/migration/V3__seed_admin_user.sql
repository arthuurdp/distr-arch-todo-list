/* Password: Admin@12345 */
INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Administrator',
    'admin@todolist.com',
    '$2a$10$MbSoTIjmB8MmzSeXGSbTAO.YwLExym2pdX7BEKCt4S9gFVnQ.Lxne',
    'ADMIN',
    NOW(),
    NOW()
);
