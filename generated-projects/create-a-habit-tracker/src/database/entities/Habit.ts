import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { HabitEntry } from "./HabitEntry";

@Entity({ name: "habits" })
export class Habit {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.habits, { onDelete: "CASCADE" })
  user!: User;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  frequency!: string;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;

  @OneToMany(() => HabitEntry, entry => entry.habit)
  entries!: HabitEntry[];
}