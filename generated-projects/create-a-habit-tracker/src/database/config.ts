import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Habit } from "./entities/Habit";
import { HabitEntry } from "./entities/HabitEntry";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_URL || path.join(__dirname, "..", "..", "data", "database.sqlite"),
  synchronize: false,
  logging: false,
  entities: [User, Habit, HabitEntry],
  migrations: [path.join(__dirname, "migration", "*.ts")],
  subscribers: [],
});