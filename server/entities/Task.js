import { EntitySchema } from "typeorm";

export const Task = new EntitySchema({
  name: "Task",
  tableName: "tasks",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    title: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    priority: {
      type: "varchar",
      length: 20,
      default: "medium",
    },
    stage: {
      type: "varchar",
      length: 20,
      default: "todo", // todo, in progress, completed
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    dueDate: {
      type: "timestamp",
      nullable: true,
    },
  },
  relations: {
    creator: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "creatorId" },
      onDelete: "SET NULL",
    },
    assignees: {
      target: "User",
      type: "many-to-many",
      joinTable: true,
      inverseSide: "assignedTasks",
    },
    subTasks: {
      target: "SubTask",
      type: "one-to-many",
      inverseSide: "task",
    },
    comments: {
      target: "Comment",
      type: "one-to-many",
      inverseSide: "task",
    },
    assets: {
      target: "Asset",
      type: "one-to-many",
      inverseSide: "task",
    },
  },
});
