const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const env    = require('../config/env');

// Ensure upload directories exist at startup. UPLOAD_DIR may be relative (dev) or
// an ABSOLUTE path (production persistent disk, e.g. /data/uploads on Render).
const UP       = env.UPLOAD_DIR || 'uploads';
const baseDir  = path.isAbsolute(UP) ? UP : path.join(process.cwd(), UP);
const facesDir = path.join(baseDir, 'faces');
[baseDir, facesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, facesDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
