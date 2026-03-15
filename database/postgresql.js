import { DataSource } from "typeorm";
import { DATABASE_URL, NODE_ENV } from "../config/env.js";
import UserEntity from "./entities/User.entity.js";
import UserTokenEntity from "./entities/UserToken.entity.js";
import OtpEntity from "./entities/Otp.entity.js";

const connectionString = DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

let cached = global.__typeorm__;

if (!cached) {
  cached = global.__typeorm__ = {
    dataSource: null,
    initialized: false,
    initializing: null,
  };
}

function createDataSource() {
  return new DataSource({
    type: "postgres",
    url: connectionString,
    synchronize: true,
    logging: false,
    entities: [UserEntity, UserTokenEntity, OtpEntity],
  });
}

export async function connectToDatabase() {
  if (!cached.dataSource) {
    cached.dataSource = createDataSource();
  }

  if (cached.initialized) {
    return cached.dataSource;
  }

  if (!cached.initializing) {
    cached.initializing = cached.dataSource
      .initialize()
      .then(() => {
        cached.initialized = true;
        console.log(`TypeORM PostgreSQL connected (${NODE_ENV})`);
      })
      .finally(() => {
        cached.initializing = null;
      });
  }

  await cached.initializing;

  return cached.dataSource;
}

export async function query(text, params = []) {
  const dataSource = await connectToDatabase();
  const rows = await dataSource.query(text, params);
  return { rows };
}

export async function getDataSource() {
  return connectToDatabase();
}

export default {
  connectToDatabase,
  query,
  getDataSource,
};
