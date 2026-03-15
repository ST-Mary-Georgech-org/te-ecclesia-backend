import express from "express";
import { PORT } from "./config/env.js";
import { connectToDatabase } from "./database/postgresql.js";
import authRouter from "./routes/auth.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.route.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.redirect("/api/v1/docs/");
});

app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/auth/", authRouter);
app.use("/api/v1/me", userRouter);

app.use(errorMiddleware);

if (process.env.NODE_ENV === "development") {
  app.listen(PORT, async () => {
    console.log(`App listening on http://localhost:${PORT}`);
    await connectToDatabase();
  });
}

export default app;
