import express from 'express';
import cors from 'cors';
import path from 'path';
import microgridRouter from './routes/microgrid.routes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5678;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded maintenance fault photos
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// System Health Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CREDiT Solar Microgrid Digital Twin Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CREDiT Solar Microgrid Digital Twin Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Microgrid REST Endpoints
app.use('/api/v1/microgrid', microgridRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(` CREDiT Microgrid Digital Twin - Backend Server Running`);
  console.log(` Server Port: ${PORT}`);
  console.log(` Base API:    http://localhost:${PORT}/api/v1/microgrid`);
  console.log(` Health:      http://localhost:${PORT}/health`);
  console.log(' Physical Specs Initialized:');
  console.log(' - PV Array: 50.3 kWp (86 x 585W Monocrystalline Panels)');
  console.log(' - PV Inverters: 2 x Solis S5-GR3P17K (34 kWac rated)');
  console.log(' - ESS Inverter: 1 x Sunsynk 20 kWac Bidirectional');
  console.log(' - Battery ESS: 102.4 kWh Dyness (2 x 51.2 kWh DL5.0C Towers)');
  console.log('================================================================');
});

export default app;

