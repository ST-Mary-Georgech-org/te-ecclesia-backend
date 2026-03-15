import { EntitySchema } from "typeorm";

const OtpEntity = new EntitySchema({
  name: "Otp",
  tableName: "otps",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    phone: {
      type: String,
      nullable: false,
    },
    purpose: {
      type: String,
      nullable: false,
    },
    otp: {
      type: String,
      nullable: false,
    },
    payload: {
      type: "jsonb",
      nullable: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    expires_at: {
      type: "timestamptz",
      nullable: false,
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

export default OtpEntity;
