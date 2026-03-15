import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import UserToken from "../models/userToken.model.js";
import {
  JWT_EXPIRES_IN,
  JWT_ACCESS_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../config/env.js";

const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parseDurationToMs(value) {
  if (!value) {
    return DEFAULT_REFRESH_TTL_MS;
  }

  const normalized = String(value).trim();
  const match = normalized.match(/^(\d+)(ms|s|m|h|d|w)?$/i);

  if (!match) {
    return DEFAULT_REFRESH_TTL_MS;
  }

  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();

  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

const REFRESH_TOKEN_TTL_MS = parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN);

export const getRefreshTokenTtlMs = () => REFRESH_TOKEN_TTL_MS;

export const createTokens = (userId) => {
  const accessToken = jwt.sign({ _id: userId }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = randomUUID();

  return { accessToken, refreshToken };
};

export const isRefreshTokenExpired = (createdAt) => {
  if (!createdAt) {
    return true;
  }

  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return true;
  }

  return Date.now() - createdAtMs > REFRESH_TOKEN_TTL_MS;
};

export const saveRefreshToken = async (userId, token, session) => {
  await UserToken.findOneAndDelete({ userId }, { session });
  await UserToken.create([{ userId, token }], { session });
};
