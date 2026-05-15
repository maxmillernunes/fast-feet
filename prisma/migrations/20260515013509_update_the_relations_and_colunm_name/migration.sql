/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `order_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `order_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDriveId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `recipientId` on the `orders` table. All the data in the column will be lost.
  - Added the required column `attachment_id` to the `order_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `order_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order_attachments" DROP CONSTRAINT "order_attachments_attachmentId_fkey";

-- DropForeignKey
ALTER TABLE "order_attachments" DROP CONSTRAINT "order_attachments_orderId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_recipientId_fkey";

-- AlterTable
ALTER TABLE "order_attachments" DROP COLUMN "attachmentId",
DROP COLUMN "orderId",
ADD COLUMN     "attachment_id" TEXT NOT NULL,
ADD COLUMN     "order_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryDriveId",
DROP COLUMN "recipientId",
ADD COLUMN     "delivery_driver_id" TEXT,
ADD COLUMN     "recipient_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_driver_id_fkey" FOREIGN KEY ("delivery_driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
