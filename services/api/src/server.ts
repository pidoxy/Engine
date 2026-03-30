import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import globalErrorHandler, {
  unexpectedRequest,
} from "@/middleware/errorHandler";
import authRouter from "@/routes/auth.router";
import userRouter from "@/routes/user.router";
import organizationRouter from "@/routes/organization.router";
import patientRouter from "@/routes/patient.router";
import consultationRouter from "@/routes/consultation.router";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { startSocketServer } from "@/service/chat.service";
import { createServer } from "http";
import { prisma } from "@/lib/prisma";

dotenv.config();

// Verify Prisma can connect on startup
prisma.$connect()
  .then(() => console.log("Database connection successfully established"))
  .catch((error: Error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });

const logger = pino({ name: "server start" });
const app: Express = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((url) => url.trim())
      : ["https://theaidcare.com", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(helmet());
app.use(cookieParser());
// app.use(rateLimiter);

// Routes

app.use("/api/v1/user", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organization", organizationRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/consultations", consultationRouter);
app.use("/", (req, res) => {
  res.json({
    success: true,
    message: "Aid Care API is running",
    statusCode: 200,
    data: null,
  });
});

const httpServer = createServer(app);
// Initialize socket server
startSocketServer(httpServer);

// Error handlers
app.use(unexpectedRequest);
app.use(globalErrorHandler);

export { app, logger, httpServer };
