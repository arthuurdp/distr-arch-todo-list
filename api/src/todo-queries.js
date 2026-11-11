const SELECT_TODO = `
  SELECT t.id,
         t.title,
         t.description,
         t.completed,
         t.due_date    AS dueDate,
         t.category_id AS categoryId,
         c.name        AS categoryName,
         t.created_at  AS createdAt,
         t.updated_at  AS updatedAt
    FROM todos t
    LEFT JOIN categories c ON c.id = t.category_id
`;

function toTodo(row) {
  const { categoryName, ...todo } = row;
  return {
    ...todo,
    completed: Boolean(row.completed),
    category: row.categoryId ? { id: row.categoryId, name: categoryName } : null,
  };
}

export function findTodo(db, userId, id) {
  const row = db.prepare(`${SELECT_TODO} WHERE t.id = ? AND t.user_id = ?`).get(id, userId);
  return row ? toTodo(row) : null;
}

export function listTodos(db, userId, { completed, categoryId } = {}) {
  const where = ['t.user_id = ?'];
  const params = [userId];

  if (completed !== undefined) {
    where.push('t.completed = ?');
    params.push(completed ? 1 : 0);
  }
  if (categoryId !== undefined) {
    where.push('t.category_id = ?');
    params.push(categoryId);
  }

  return db
    .prepare(`${SELECT_TODO} WHERE ${where.join(' AND ')} ORDER BY t.created_at DESC, t.id DESC`)
    .all(...params)
    .map(toTodo);
}
