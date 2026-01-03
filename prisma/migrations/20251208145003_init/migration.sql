-- CreateTable
CREATE TABLE "Symbol" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "code1" VARCHAR(5),
    "code2" VARCHAR(5),
    "code3" VARCHAR(5),
    "note" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "symbolId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" CHAR(1) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION,
    "note" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Symbol_name_idx" ON "Symbol"("name");

-- CreateIndex
CREATE INDEX "Transaction_symbolId_idx" ON "Transaction"("symbolId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
