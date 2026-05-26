
import app from "./app";
import env from "./config/env";
import pool from "./config/db";

async function startServer() {
  const connection = await pool.getConnection();
  connection.release();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

startServer();