-- Add `code` column and expand `name` length
ALTER TABLE "Symbol" ADD COLUMN "code" VARCHAR(10);
ALTER TABLE "Symbol" ALTER COLUMN "name" TYPE VARCHAR(255);