import { AppDataSource } from "./config";
import { UserRepository } from "./repositories/UserRepository";
import { HabitRepository } from "./repositories/HabitRepository";
import { HabitEntryRepository } from "./repositories/HabitEntryRepository";
import { Logger } from "tslog";

const logger = new Logger();

async function seed() {
  await AppDataSource.initialize();
  const userRepo = new UserRepository();
  const habitRepo = new HabitRepository();
  const entryRepo = new HabitEntryRepository();

  const email = "demo@example.com";
  const password = "password123";

  let user = await userRepo.findByEmail(email);
  if (!user) {
    user = await userRepo.create(email, password);
    logger.info(`Created demo user: ${email}`);
  } else {
    logger.info(`Demo user already exists: ${email}`);
  }

  const habitName = "Drink Water";
  let habit = (await habitRepo.findAllByUser(user.id)).find(h => h.name === habitName);
  if (!habit) {
    habit = await habitRepo.create(user.id, habitName, "Drink 8 glasses of water", "daily");
    logger.info(`Created demo habit: ${habitName}`);
  } else {
    logger.info(`Demo habit already exists: ${habitName}`);
  }

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const existing = await entryRepo.findByHabitAndDate(habit.id, dateStr);
    if (!existing) {
      await entryRepo.create(habit.id, dateStr, true);
      logger.info(`Created entry for ${dateStr}`);
    }
  }

  await AppDataSource.destroy();
}

seed().catch(err => {
  logger.error("Seeding failed", err);
  process.exit(1);
});