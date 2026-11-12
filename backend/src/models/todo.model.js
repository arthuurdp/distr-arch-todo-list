export class Todo {
  constructor({
    id,
    title,
    description,
    completed,
    dueDate,
    categoryId,
    category,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.dueDate = dueDate;
    this.categoryId = categoryId;
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromRow(row) {
    return new Todo({
      id: row.id,
      title: row.title,
      description: row.description,
      completed: Boolean(row.completed),
      dueDate: row.due_date,
      categoryId: row.category_id,
      category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
