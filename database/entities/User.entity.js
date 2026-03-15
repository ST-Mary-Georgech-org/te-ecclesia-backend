import { EntitySchema } from "typeorm";

const UserEntity = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    username: {
      type: String,
      nullable: false,
    },
    phone: {
      type: String,
      unique: true,
      nullable: false,
    },
    password: {
      type: String,
      nullable: false,
      select: false,
    },
    created_at: {
      type: "timestamptz",
      createDate: true,
    },
    updated_at: {
      type: "timestamptz",
      updateDate: true,
    },
  },
});

export default UserEntity;
