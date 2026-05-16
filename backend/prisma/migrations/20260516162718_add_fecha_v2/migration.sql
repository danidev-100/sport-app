-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "fechaId" TEXT;

-- AlterTable
ALTER TABLE "Ingreso" ADD COLUMN     "fechaId" TEXT;

-- CreateTable
CREATE TABLE "Fecha" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fecha_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_fechaId_fkey" FOREIGN KEY ("fechaId") REFERENCES "Fecha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_fechaId_fkey" FOREIGN KEY ("fechaId") REFERENCES "Fecha"("id") ON DELETE CASCADE ON UPDATE CASCADE;
