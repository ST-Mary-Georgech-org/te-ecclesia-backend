import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { throwError } from "../utils/errorHandle.js";
import {
  createTokens,
  saveRefreshToken,
  isRefreshTokenExpired,
} from "./token.controller.js";
import { connectToDatabase } from "../database/postgresql.js";
import UserToken from "../models/userToken.model.js";
import Otp from "../models/otp.model.js";

const OTP_CODE = "0000";
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_PURPOSE_SIGNUP = "SIGNUP";
const OTP_PURPOSE_RESET_PASSWORD = "RESET_PASSWORD";

function getOtpExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MS);
}

function isOtpExpired(expiresAt) {
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return true;
  }

  return Date.now() > expiresMs;
}

async function sendOtp() {
  // OTP transport intentionally left empty for now.
}

export const signUp = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { username, phone, password } = req.body || {};

    if (!username || !phone || !password) {
      throwError(400, "Username, phone, and password are required");
    }

    if (password.trim().length < 8) {
      throwError(400, "Password must be at least 8 characters long");
    }

    const existingUserByPhone = await User.findOne({ phone }).lean();
    if (existingUserByPhone) {
      throwError(409, "Phone already used by another account");
    }

    const existingUserByUsername = await User.findOne({ username }).lean();
    if (existingUserByUsername) {
      throwError(409, "Username already used by another account");
    }

    const hashedPassword = await generateHashedPassword(password);

    await Otp.createOrReplace({
      phone,
      purpose: OTP_PURPOSE_SIGNUP,
      otp: OTP_CODE,
      payload: {
        username,
        password: hashedPassword,
      },
      expiresAt: getOtpExpiresAt(),
    });

    await sendOtp(phone, OTP_CODE, OTP_PURPOSE_SIGNUP);

    return res.status(200).json({
      code: 200,
      message: "OTP sent to phone successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const verifySignUpOtp = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { phone, otp } = req.body || {};

    if (!phone || !otp) {
      throwError(400, "Phone and OTP are required");
    }

    const otpRecord = await Otp.findOne({
      phone,
      purpose: OTP_PURPOSE_SIGNUP,
      otp,
    });

    if (!otpRecord) {
      throwError(401, "Invalid OTP");
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await Otp.deleteById(otpRecord.id);
      throwError(401, "OTP has expired");
    }

    const { username, password } = otpRecord.payload || {};
    if (!username || !password) {
      await Otp.deleteById(otpRecord.id);
      throwError(400, "Invalid OTP payload");
    }

    const existingUserByPhone = await User.findOne({ phone }).lean();
    if (existingUserByPhone) {
      await Otp.deleteById(otpRecord.id);
      throwError(409, "Phone already used by another account");
    }

    const existingUserByUsername = await User.findOne({ username }).lean();
    if (existingUserByUsername) {
      await Otp.deleteById(otpRecord.id);
      throwError(409, "Username already used by another account");
    }

    const newUser = await User.create({
      username,
      phone,
      password,
    });

    const { accessToken, refreshToken } = await createTokens(newUser._id);
    await saveRefreshToken(newUser._id, refreshToken);

    await Otp.deleteById(otpRecord.id);

    return res.status(200).json({
      code: 200,
      message: "OTP verified and user created successfully",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    await connectToDatabase();
    if (!req.body) throwError(400, "Should provide login data");

    const { username, password } = req.body;

    if (!username || !password) {
      throwError(400, "Username and password are required");
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      throwError(401, "Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throwError(401, "Invalid username or password");
    }

    const { accessToken, refreshToken } = await createTokens(user._id);

    await saveRefreshToken(user._id, refreshToken);

    res.status(200).json({
      code: 200,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      throwError(400, "Refresh token is required");
    }

    const storedToken = await UserToken.findOne({ token: refreshToken });
    if (!storedToken) {
      throwError(401, "Invalid refresh token");
    }

    if (isRefreshTokenExpired(storedToken.createdAt)) {
      await UserToken.findOneAndDelete({ userId: storedToken.userId });
      throwError(401, "Refresh token has expired");
    }

    const user = await User.findById(storedToken.userId).lean();
    if (!user) {
      throwError(401, "User not found for this refresh token");
    }

    const tokens = createTokens(user._id);
    await saveRefreshToken(user._id, tokens.refreshToken);

    return res.status(200).json({
      code: 200,
      message: "Token refreshed successfully",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      throwError(400, "Refresh token is required");
    }

    await UserToken.deleteByToken(refreshToken);

    return res.status(200).json({
      code: 200,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { phone } = req.body;
    if (!phone) throwError(400, "Phone is required");

    const user = await User.findOne({ phone }).lean();
    if (!user) {
      return res.status(200).json({
        code: 200,
        message: "If this phone exists, an OTP has been sent",
      });
    }

    await Otp.createOrReplace({
      phone,
      purpose: OTP_PURPOSE_RESET_PASSWORD,
      otp: OTP_CODE,
      expiresAt: getOtpExpiresAt(),
    });

    await sendOtp(phone, OTP_CODE, OTP_PURPOSE_RESET_PASSWORD);

    res.status(200).json({
      code: 200,
      message: "If this phone exists, an OTP has been sent",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyResetPasswordOtp = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { phone, otp } = req.body || {};

    if (!phone || !otp) {
      throwError(400, "Phone and OTP are required");
    }

    const otpRecord = await Otp.findOne({
      phone,
      purpose: OTP_PURPOSE_RESET_PASSWORD,
      otp,
    });

    if (!otpRecord) {
      throwError(401, "Invalid OTP");
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await Otp.deleteById(otpRecord.id);
      throwError(401, "OTP has expired");
    }

    await Otp.markVerified(otpRecord.id);

    return res.status(200).json({
      code: 200,
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await connectToDatabase();
    const { phone, otp, newPassword } = req.body || {};
    if (!phone || !otp || !newPassword) {
      throwError(400, "Phone, OTP, and new password are required");
    }

    if (newPassword.trim().length < 8) {
      throwError(400, "Password must be at least 8 characters long");
    }

    const otpRecord = await Otp.findOne({
      phone,
      purpose: OTP_PURPOSE_RESET_PASSWORD,
      otp,
    });

    if (!otpRecord) {
      throwError(401, "Invalid OTP");
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await Otp.deleteById(otpRecord.id);
      throwError(401, "OTP has expired");
    }

    if (!otpRecord.isVerified) {
      throwError(400, "OTP must be verified first");
    }

    const user = await User.findOne({ phone }).select("+password");
    if (!user) throwError(404, "User not found");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    await Otp.deleteById(otpRecord.id);

    res.status(200).json({
      code: 200,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

async function generateHashedPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}
