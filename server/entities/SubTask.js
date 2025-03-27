const { EntitySchema } = require("typeorm");

const SubTask = new EntitySchema({
  name: "SubTask",
  tableName: "subtasks",
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
    isCompleted: {
      type: "boolean",
      default: false,
    },
    tag: {
      type: "varchar",
      length: 50,
      nullable: true,
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
  },
});

module.exports = { SubTask };
