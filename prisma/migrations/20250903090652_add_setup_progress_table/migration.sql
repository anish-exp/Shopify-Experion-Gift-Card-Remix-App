-- CreateTable
CREATE TABLE "SetupProgress" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "appBlockDone" BOOLEAN NOT NULL DEFAULT false,
    "productTypeDone" BOOLEAN NOT NULL DEFAULT false,
    "checkoutRuleDone" BOOLEAN NOT NULL DEFAULT false,
    "collectionDone" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "SetupProgress_shop_key" ON "SetupProgress"("shop");
