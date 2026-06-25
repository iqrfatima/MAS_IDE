import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables20230901 implements MigrationInterface {
  name = "CreateTables20230901";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "email" TEXT NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "habits" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "frequency" TEXT NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "habit_entries" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "habitId" INTEGER NOT NULL,
        "date" DATE NOT NULL,
        "completed" BOOLEAN NOT NULL DEFAULT 0,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("habitId", "date"),
        FOREIGN KEY ("habitId") REFERENCES "habits" ("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "habit_entries";`);
    await queryRunner.query(`DROP TABLE "habits";`);
    await queryRunner.query(`DROP TABLE "users";`);
  }
}