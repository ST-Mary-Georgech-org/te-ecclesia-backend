import { connectToDatabase } from "../database/postgresql.js";

export const userDetails = async (req, res, next) => {
  try {
    await connectToDatabase();
    const user = req.user.toObject();

    delete user.password;

    res.status(200).json({
      code: 200,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
