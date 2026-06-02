import express from "express";

import orderRoutes
  from "./routes/order.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());

app.use("/orders", orderRoutes);
app.use(errorHandler);

export default app;