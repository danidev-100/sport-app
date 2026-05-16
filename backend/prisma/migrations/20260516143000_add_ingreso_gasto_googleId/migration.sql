-- AlterEnum
BEGIN;
CREATE TYPE "Categoria_new" AS ENUM ('C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO');
ALTER TABLE "Jugador" ALTER COLUMN "categoria" TYPE "Categoria_new" USING ("categoria"::text::"Categoria_new");
ALTER TYPE "Categoria" RENAME TO "Categoria_old";
ALTER TYPE "Categoria_new" RENAME TO "Categoria";
DROP TYPE "public"."Categoria_old";
COMMIT;

-- AlterTable
ALTER TABLE "Cuota" ADD COLUMN     "numeroIdentificacion" TEXT;

-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "googleId" TEXT;

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "partidoId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "partidoId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_googleId_key" ON "Jugador"("googleId");
