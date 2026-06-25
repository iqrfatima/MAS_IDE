import { AppDataSource } from "../config";
import { HabitEntry } from "../entities/HabitEntry";
import { Repository } from "typeorm";
import { Logger } from "tslog";

const logger = new Logger();

export class HabitEntryRepository {
  private repo: Repository<HabitEntry>;

  constructor() {
    this.repo = AppDataSource.getRepository(HabitEntry);
  }

  async create(habitId: number, date: string, completed: boolean = false): Promise<HabitEntry> {
    const entry = this.repo.create({ habit: { id: habitId } as any, date, completed });
    try {
      return await this.repo.save(entry);
    } catch (err) {
      logger.error("Error creating habit entry", err);
      throw err;
    }
  }

  async findByHabitAndDate(habitId: number, date: string): Promise<HabitEntry | null> {
    return await this.repo.findOne({ where: { habit: { id: habitId }, date } });
  }

  async update(id: number, fields: Partial<Omit<HabitEntry, "id" | "habit" | "created_at" | "updated_at">>): Promise<HabitEntry | null> {
    const entry = await this.repo.findOneBy({ id });
    if (!entry) return null;
    Object.assign(entry, fields);
    try {
      return await this.repo.save(entry);
    } catch (err) {
      logger.error("Error updating habit entry", err);
      throw err;
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async listByHabit(habitId: number): Promise<HabitEntry[]> {
    return await this.repo.find({ where: { habit: { id: habitId } }, order: { date: "ASC" } });
  }
}