/*
  Warnings:

  - You are about to drop the `order_attachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_attachments" DROP CONSTRAINT "order_attachments_attachment_id_fkey";

-- DropForeignKey
ALTER TABLE "order_attachments" DROP CONSTRAINT "order_attachments_order_id_fkey";

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "order_attachments";

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
