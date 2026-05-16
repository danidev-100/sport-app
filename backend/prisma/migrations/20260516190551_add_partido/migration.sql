/*
  Warnings:

  - You are about to drop the column `fechaId` on the `Gasto` table. All the data in the column will be lost.
  - You are about to drop the column `fechaId` on the `Ingreso` table. All the data in the column will be lost.
  - You are about to drop the `Fecha` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_fechaId_fkey";

-- DropForeignKey
ALTER TABLE "Ingreso" DROP CONSTRAINT "Ingreso_fechaId_fkey";

-- AlterTable
ALTER TABLE "Gasto" DROP COLUMN "fechaId";

-- AlterTable
ALTER TABLE "Ingreso" DROP COLUMN "fechaId";

-- DropTable
DROP TABLE "Fecha";

-- CreateTable
CREATE TABLE "Partido" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
