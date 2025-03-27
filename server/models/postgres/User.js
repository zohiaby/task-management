import { EntitySchema } from "typeorm";
import bcrypt from "bcryptjs";

const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 100,
      unique: true,
      nullable: false,
    },
    password: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    role: {
      type: "varchar",
      length: 20,
      default: "user",
    },
    isAdmin: {
      type: "boolean",
      default: false,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    avatar: {
      type: "varchar",
      length: 255,
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
    createdTasks: {
      target: "Task",
      type: "one-to-many",
      inverseSide: "creator",
    },
    assignedTasks: {
      target: "Task",
      type: "many-to-many",
      joinTable: true,
      inverseSide: "assignees",
    },
  },
  indices: [
    {
      name: "email_idx",
      columns: ["email"],
      unique: true,
    },
  ],
});

export default User;

// Helper methods for User entity
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};
