import multer from "multer";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("UNSUPPORTED_TYPE"));
    }
    cb(null, true);
  },
});

// Read the first bytes of the file to find what it really is.
function detectType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

const fail = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

export function uploadImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE")
        return fail(res, 413, "FILE_TOO_LARGE", "Image must be 4 MB or smaller.");
      if (err.message === "UNSUPPORTED_TYPE")
        return fail(res, 400, "UNSUPPORTED_TYPE", "Please upload a JPEG, PNG or WebP image.");
      if (err instanceof multer.MulterError)
        return fail(res, 400, "BAD_UPLOAD", "Send exactly one file in the field named 'image'.");
      return next(err);
    }
    if (!req.file) return fail(res, 400, "NO_FILE", "No image was uploaded.");

    const realType = detectType(req.file.buffer);
    if (!realType) return fail(res, 400, "INVALID_IMAGE", "That file is not a valid image.");

    req.file.detectedType = realType;
    next();
  });
}