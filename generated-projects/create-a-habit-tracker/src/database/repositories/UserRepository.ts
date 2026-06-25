import { AppDataSource } from "../config";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import bcrypt from "bcrypt";
import { Logger } from "tslog";

const logger = new Logger();

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async create(email: string, password: string): Promise<User> {
    const password_hash = await bcrypt.hash(password, 10);
    const user = this.repo.create({ email, password_hash });
    try {
      return await this.repo.save(user);
    } catch (err) {
      logger.error("Error creating user", err);
      throw err;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repo.findOneBy({ email });
  }

  async findById(id: number): Promise<User | null> {
    return await this.repo.findOneBy({ id });
  }

  async validatePassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return await bcrypt.compare(password, user.password_hash);
  }
}