import express from "express";
import importRoute from "./routes/importRoute.js";

const app = express();

app.use(express.json());
app.use("/api", importRoute);

app.get("/", (req, res) => res.send("CSV → JSON → Postgres API"));

export default app;
