require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  DATABASE_URL: required('DATABASE_URL'),

  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  QR_SECRET_KEY: required('QR_SECRET_KEY'),
  QR_DEFAULT_ROTATION_SECONDS: parseInt(process.env.QR_DEFAULT_ROTATION_SECONDS || '30', 10),

  // NOTE: Wi-Fi SSID, work hours, grace windows and penalties are NOT fixed in
  // code — they live per-office in the database, set from the Super Admin panel.
  // ── Session automation windows (minutes) ──
  SESSION_LEAD_MIN:       parseInt(process.env.SESSION_LEAD_MIN || '30', 10),   // admin may create from openTime-30
  AUTO_CREATE_LEAD_MIN:   parseInt(process.env.AUTO_CREATE_LEAD_MIN || '10', 10), // backend auto-creates at openTime-10
  CHECKIN_WINDOW_MIN:     parseInt(process.env.CHECKIN_WINDOW_MIN || '40', 10),  // check-in open for 40 min after session start
  AUTO_CHECKOUT_LAG_MIN:  parseInt(process.env.AUTO_CHECKOUT_LAG_MIN || '40', 10), // auto check-out at closeTime+40

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@attendance.local',

  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
};
