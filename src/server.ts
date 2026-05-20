
import app from "./app";
import env from "./config/env";
import pool from "./config/db";

async function startServer() {
  await pool.connect();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

startServer();