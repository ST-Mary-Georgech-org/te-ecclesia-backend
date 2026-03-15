import { config } from "dotenv";

config({ path: ".env" });

export const {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  JWT_ACCESS_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  API_URL,
  API_DESCRIPTION,
} = process.env;
