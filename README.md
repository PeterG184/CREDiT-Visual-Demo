# CREDiT Digital Twin Platform

Interactive monitoring, forecasting, and load management interface designed for a rural community solar microgrid in Sub-Saharan Africa.

---

## Hardware & System Overview

* **PV Array:** 50.3 kWp (86 x 585W panels)
* **PV Inverters:** 2 x Solis S5-GR3P17K (17 kWac / 25.5 kWdc each)
* **Battery Inverter:** 1 x Sunsynk/Deye SUN-20K-SG05LP3-EU-SM2 (20 kWac)
* **Energy Storage System (ESS):** 102.4 kWh Total Capacity
  * Tower 1: 10 x Dyness DL5.0C (51.2 kWh / 51.2V Stack)
  * Tower 2: 10 x Dyness DL5.0C (51.2 kWh / 51.2V Stack)
* **Environmental Station:** Irradiance ($W/m^2$), Ambient Temperature, Humidity, Wind Speed & Direction.

---

## Repository Structure

```
CREDiT-Visual-Demo/
├── frontend/               # React Native (Expo Router) for Web & Mobile
│   ├── app/                # File-based routing ((tabs): dashboard, forecast, allocation, battery, maintenance)
│   ├── components/         # Reusable high-contrast UI components (Charts, Cards, Headers)
│   ├── constants/          # Design system tokens (Colors, Typography, Layout)
│   ├── locales/            # i18n translation catalogs (en.json)
│   ├── services/           # API client and client-side simulation engine fallback
│   └── types/              # TypeScript interfaces
├── backend/                # Node.js / Express (TypeScript) dynamic simulation server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # Express API routes (/api/v1/*)
│   │   ├── services/       # Diurnal solar physics & battery balancing engine
│   │   └── types/          # Shared telemetry models
│   └── tsconfig.json
├── design_spec.txt         # Full technical and design specifications
└── README.md
```

---

## Port Allocation

* **Frontend:** Defaults to Expo web port (e.g., `8081`)
* **Backend:** Port `5678` (`/api/v1`)

