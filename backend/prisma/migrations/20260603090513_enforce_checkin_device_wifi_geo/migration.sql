-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "checkInLat" DOUBLE PRECISION,
ADD COLUMN     "checkInLng" DOUBLE PRECISION,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "distanceMeters" DOUBLE PRECISION,
ADD COLUMN     "penalty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wifiSSID" TEXT;

-- AlterTable
ALTER TABLE "offices" ADD COLUMN     "geoRadius" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "wifiSSID" TEXT;

-- AlterTable
ALTER TABLE "security_settings" ADD COLUMN     "geoFencingRequired" BOOLEAN NOT NULL DEFAULT false;
