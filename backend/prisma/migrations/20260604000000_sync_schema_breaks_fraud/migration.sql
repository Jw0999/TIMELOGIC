-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FraudType" ADD VALUE 'OVERSTAYED_BREAK';
ALTER TYPE "FraudType" ADD VALUE 'BREAK_OFF_WIFI';

-- DropForeignKey
ALTER TABLE "attendance_sessions" DROP CONSTRAINT "attendance_sessions_officeId_fkey";

-- DropForeignKey
ALTER TABLE "selfie_verifications" DROP CONSTRAINT "selfie_verifications_attendanceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "selfie_verifications" DROP CONSTRAINT "selfie_verifications_employeeId_fkey";

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "checkInLat",
DROP COLUMN "checkInLng",
DROP COLUMN "distanceMeters",
DROP COLUMN "selfieImageUrl",
DROP COLUMN "selfieMatchScore",
DROP COLUMN "selfieVerified";

-- AlterTable
ALTER TABLE "attendance_sessions" DROP COLUMN "deviceBindingRequired",
DROP COLUMN "selfieRequired",
DROP COLUMN "wifiRequired",
ADD COLUMN     "officeName" TEXT,
ADD COLUMN     "orgName" TEXT,
ALTER COLUMN "officeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "break_policies" ADD COLUMN     "breakEnd" TEXT,
ADD COLUMN     "breakStart" TEXT;

-- AlterTable
ALTER TABLE "offices" DROP COLUMN "geoLat",
DROP COLUMN "geoLng",
DROP COLUMN "geoRadius";

-- AlterTable
ALTER TABLE "security_settings" DROP COLUMN "geoFencingRequired",
DROP COLUMN "selfieMatchThreshold",
DROP COLUMN "selfieRequired";

-- DropTable
DROP TABLE "selfie_verifications";

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
