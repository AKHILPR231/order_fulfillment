import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: process.env.PORT || 3000,

  NODE_ENV: process.env.NODE_ENV || "development",

  DB_HOST: process.env.DB_HOST || "localhost",

  DB_PORT: Number(process.env.DB_PORT) || 3306,

  DB_NAME: process.env.DB_NAME || "OFM",

  DB_USER: process.env.DB_USER || "root",

  DB_PASSWORD: process.env.DB_PASSWORD || "",
};
export default env;
