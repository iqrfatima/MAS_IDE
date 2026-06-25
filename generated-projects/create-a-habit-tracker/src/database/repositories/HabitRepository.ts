import { AppDataSource } from "../config";
import { Habit } from "../entities/Habit";
import { Repository } from "typeorm";
import { Logger } from "tslog";

const logger = new Logger();

export class HabitRepository {
  private repo: Repository<Habit>;

  constructor() {
    this.repo = AppDataSource.getRepository(Habit);
  }

  async create(userId: number, name: string, description: string | null, frequency: string): Promise<Habit> {
    const habit = this.repo.create({ user: { id: userId } as any, name, description, frequency });
    try {
      return await this.repo.save(habit);
    } catch (err) {
      logger.error("Error creating habit", err);
      throw err;
    }
  }

  async findById(id: number): Promise<Habit | null> {
    return await this.repo.findOne({ where: { id }, relations: ["user"] });
  }

  async findAllByUser(userId: number): Promise<Habit[]> {
    return await this.repo.find({ where: { user: { id: userId } }, relations: ["user"] });
  }

  async update(id: number, fields: Partial<Omit<Habit, "id" | "user" | "created_at" | "updated_at">>): Promise<Habit | null> {
    const habit = await this.findById(id);
    if (!habit) return null;
    Object.assign(habit, fields);
    try {
      return await this.repo.save(habit);
    } catch (err) {
      logger.error("Error updating habit", err);
      throw err;
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== undefined && result.affected > 0;
  }
}