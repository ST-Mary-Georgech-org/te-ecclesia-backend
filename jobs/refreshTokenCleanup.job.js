import UserToken from "../models/userToken.model.js";
import { connectToDatabase } from "../database/postgresql.js";
import { getRefreshTokenTtlMs } from "../controllers/token.controller.js";

const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function getCutoffDate() {
  const ttlMs = getRefreshTokenTtlMs();
  return new Date(Date.now() - ttlMs);
}

export async function cleanupExpiredRefreshTokens() {
  await connectToDatabase();
  const cutoff = getCutoffDate();

  return UserToken.deleteExpiredBefore(cutoff);
}