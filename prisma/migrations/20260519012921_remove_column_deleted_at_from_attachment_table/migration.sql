/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `attachments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "deleted_at";
