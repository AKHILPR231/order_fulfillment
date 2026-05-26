import express from "express";

import orderRoutes
  from "./routes/order.routes";

const app = express();

app.use(express.json());

app.use("/orders", orderRoutes);

export default app;