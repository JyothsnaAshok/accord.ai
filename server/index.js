import express from "express";
import helmet from "helmet";
import "dotenv/config";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import cors from "cors";
import { insightsRouter } from "./routes/insights.js";
import { eSignRouter } from "./routes/esign.js";
import session from "express-session";

const PORT = process.env.PORT || 8000;

const app = express();

// print all env variables

console.log(process.env);

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

app.use(cookieParser("+ crypto.randomBytes(64) + "));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// enable cors
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);
app.options("*", cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

// Handle GET requests to /api route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});
app.use("/insights", insightsRouter);
app.use("/esign", eSignRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🗸 App Started without Errors : Server listening on ${PORT}`);
});
