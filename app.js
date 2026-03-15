import express from "express";
import { PORT } from "./config/env.js";
import { connectToDatabase } from "./database/postgresql.js";
import authRouter from "./routes/auth.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.route.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import { renderSwaggerUiPage } from "./docs/swaggerUiPage.js";

const app = express();
const isDevelopment = process.env.NODE_ENV === "development";
const DOCS_PATH = "/api/v1/docs";
const DOCS_SPEC_PATH = `${DOCS_PATH}/swagger.json`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.redirect(`${DOCS_PATH}/`);
});

app.get(DOCS_SPEC_PATH, (req, res) => {
  return res.status(200).json(swaggerSpec);
});

if (isDevelopment) {
  app.use(
    DOCS_PATH,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        url: DOCS_SPEC_PATH,
        validatorUrl: null,
      },
      explorer: true,
    }),
  );
} else {
  app.get(`${DOCS_PATH}/`, (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(renderSwaggerUiPage(DOCS_SPEC_PATH));
  });
}

app.use("/api/v1/auth/", authRouter);
app.use("/api/v1/me", userRouter);

app.use(errorMiddleware);

if (isDevelopment) {
  app.listen(PORT, async () => {
    console.log(`App listening on http://localhost:${PORT}`);
    await connectToDatabase();
  });
}

export default app;
