export class Category {
  constructor({ id, name, todoCount, createdAt }) {
    this.id = id;
    this.name = name;
    this.todoCount = todoCount;
    this.createdAt = createdAt;
  }

  static fromRow(row) {
    return new Category({
      id: row.id,
      name: row.name,
      todoCount: row.todo_count,
      createdAt: row.created_at,
    });
  }
}
