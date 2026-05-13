-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('BENJAMINES', 'ALEVES', 'INFANTILES', 'CADETES', 'JUVENILES', 'SENIOR', 'FEMENINO');

-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "categoria" "Categoria",
ALTER COLUMN "posicion" DROP NOT NULL;
