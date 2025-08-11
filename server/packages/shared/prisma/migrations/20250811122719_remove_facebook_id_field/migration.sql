/*
  Warnings:

  - The values [FACEBOOK] on the enum `AuthProvider` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `facebookId` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AuthProvider_new" AS ENUM ('EMAIL', 'GOOGLE');
ALTER TABLE "public"."User" ALTER COLUMN "authProvider" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "authProvider" TYPE "public"."AuthProvider_new" USING ("authProvider"::text::"public"."AuthProvider_new");
ALTER TYPE "public"."AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "public"."AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "public"."AuthProvider_old";
ALTER TABLE "public"."User" ALTER COLUMN "authProvider" SET DEFAULT 'EMAIL';
COMMIT;

-- DropIndex
DROP INDEX "public"."User_facebookId_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "facebookId";
