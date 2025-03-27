import { EntitySchema } from "typeorm";

const Comment = new EntitySchema({
  name: "Comment",
  tableName: "comments",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    content: {
      type: "text",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    task: {
      target: "Task",
      type: "many-to-one",
      joinColumn: { name: "taskId" },
      onDelete: "CASCADE",
    },
    author: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "authorId" },
      onDelete: "CASCADE",
    },
  },
});

export default Comment;
