/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."reports" ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "reports_url_key" ON "public"."reports"("url");
