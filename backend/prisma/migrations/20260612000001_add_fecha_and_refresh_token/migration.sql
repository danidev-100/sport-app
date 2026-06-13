-- Re-create Fecha table (was dropped by add_partido migration)
-- Add the `fecha` column that the updated schema requires

CREATE TABLE "Fecha" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fecha_pkey" PRIMARY KEY ("id")
);

-- Re-add fechaId columns to Ingreso and Gasto (were dropped by add_partido)

ALTER TABLE "Ingreso" ADD COLUMN "fechaId" TEXT;
ALTER TABLE "Gasto" ADD COLUMN "fechaId" TEXT;

-- Add foreign keys for fechaId

ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_fechaId_fkey" FOREIGN KEY ("fechaId") REFERENCES "Fecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_fechaId_fkey" FOREIGN KEY ("fechaId") REFERENCES "Fecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create RefreshToken table for JWT refresh token flow

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Create unique index on token for fast lookup
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- Add foreign key for RefreshToken -> User with cascade delete
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop unused Posicion enum (schema no longer references it)
DROP TYPE IF EXISTS "public"."Posicion";
