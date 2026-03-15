import { EntitySchema } from "typeorm";

const UserTokenEntity = new EntitySchema({
  name: "UserToken",
  tableName: "user_tokens",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      name: "user_id",
      type: "uuid",
      unique: true,
      nullable: false,
    },
    token: {
      type: String,
      nullable: false,
    },
    created_at: {
      type: "timestamptz",
      createDate: true,
    },
  },
});

export default UserTokenEntity;
