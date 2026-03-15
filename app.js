import express from "express";
import { PORT } from "./config/env.js";
import { connectToDatabase } from "./database/postgresql.js";
import authRouter from "./routes/auth.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.route.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

const app = express();
const isDevelopment = process.env.NODE_ENV === "development";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.redirect("/api/v1/docs/");
});

app.get("/api/v1/docs/swagger.json", (req, res) => {
  return res.status(200).json(swaggerSpec);
});

if (isDevelopment) {
  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        url: "/api/v1/docs/swagger.json",
        validatorUrl: null,
      },
      explorer: true,
    }),
  );
} else {
  app.get("/api/v1/docs/", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html, body { margin: 0; padding: 0; }
    #swagger-ui { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/v1/docs/swagger.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout'
    });
  </script>
</body>
</html>`);
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
