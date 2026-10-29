import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as controller from '../controllers/microgrid.controller';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for maintenance fault photos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${basename}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per spec
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(null, true); // Permissive for mock demos
  },
});

// REST Endpoints
router.get('/overview', controller.getOverview);
router.get('/forecast/24h', controller.getForecast);
router.get('/allocations', controller.getAllocations);
router.get('/battery/diagnostics', controller.getBatteryDiagnostics);
router.get('/maintenance/inverters', controller.getInverters);
router.get('/maintenance/reports', controller.listMaintenanceReports);

// Maintenance report supports both JSON payload and multipart form-data with optional 'photo' file
router.post(
  '/maintenance/report',
  upload.single('photo'),
  controller.submitMaintenanceReport
);

export default router;

