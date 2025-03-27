const { EntitySchema } = require("typeorm");

const Asset = new EntitySchema({
  name: "Asset",
  tableName: "assets",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    fileUrl: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    fileType: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    task: {
      target: "Task",
      type: "many-to-one",
      joinColumn: { name: "taskId" },
      onDelete: "CASCADE",
    },
    uploader: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "uploaderId" },
      onDelete: "SET NULL",
    },
  },
});

module.exports = Asset;
