const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createStorage = (folder) => {
  const dir = path.join(__dirname, `../uploads/${folder}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

const uploadProfile   = multer({ storage: createStorage("profiles"),  fileFilter, limits: { fileSize: maxSize } });
const uploadService   = multer({ storage: createStorage("services"),  fileFilter, limits: { fileSize: maxSize } });
const uploadDocuments = multer({ storage: createStorage("documents"), fileFilter, limits: { fileSize: maxSize } });
const uploadWork      = multer({ storage: createStorage("work"),      fileFilter, limits: { fileSize: maxSize } });

module.exports = { uploadProfile, uploadService, uploadDocuments, uploadWork };
