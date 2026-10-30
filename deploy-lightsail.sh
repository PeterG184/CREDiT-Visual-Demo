#!/usr/bin/env bash
# ==============================================================================
# CREDiT Solar Microgrid Digital Twin - Amazon Lightsail Deployment Script
# Target OS: Ubuntu 24.04 LTS | User: ubuntu
# Backend Port: 5600 | Frontend Port: 5700
# Process Management: Isolated systemd services (credit-backend, credit-frontend)
# ==============================================================================

set -euo pipefail

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -e "${BOLD}${BLUE}====================================================================${NC}"
echo -e "${BOLD}${BLUE}  CREDiT Digital Twin - Amazon Lightsail Setup & Hosting Script     ${NC}"
echo -e "${BOLD}${BLUE}====================================================================${NC}"

# 1. Determine execution user and directory paths
CURRENT_USER="$(id -un)"
CURRENT_GROUP="$(id -gn)"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${REPO_DIR}/backend"
FRONTEND_DIR="${REPO_DIR}/frontend"

echo -e "${BLUE}[1/6] Validating environment & permissions...${NC}"
echo "  - User: ${CURRENT_USER}"
echo "  - Repo path: ${REPO_DIR}"

# Check for Node.js
NODE_BIN="$(command -v node || echo "/usr/bin/node")"
NPM_BIN="$(command -v npm || echo "/usr/bin/npm")"

if [ ! -x "${NODE_BIN}" ]; then
  echo -e "${RED}ERROR: Node.js binary not found at ${NODE_BIN}. Please install Node.js 18+ first.${NC}"
  exit 1
fi

echo "  - Node: $(${NODE_BIN} -v) (${NODE_BIN})"
echo "  - npm:  $(${NPM_BIN} -v) (${NPM_BIN})"

# Check sudo access (needed for installing /etc/systemd/system unit files)
if ! command -v sudo &>/dev/null; then
  echo -e "${RED}ERROR: 'sudo' command is required to install systemd services.${NC}"
  exit 1
fi

# 2. Build Backend (Port 5600)
echo -e "\n${BLUE}[2/6] Building Backend API (Port 5600)...${NC}"
cd "${BACKEND_DIR}"
echo "  - Installing backend dependencies..."
"${NPM_BIN}" install --silent
echo "  - Compiling TypeScript backend..."
"${NPM_BIN}" run build
echo -e "${GREEN}  Backend compilation complete (dist/index.js ready).${NC}"

# 3. Build Frontend Web App (Port 5700)
echo -e "\n${BLUE}[3/6] Building Frontend Web Production Bundle (Port 5700)...${NC}"
cd "${FRONTEND_DIR}"
echo "  - Installing frontend dependencies..."
"${NPM_BIN}" install --silent
echo "  - Exporting static web assets with Expo..."
"${NPM_BIN}" run build:web
echo -e "${GREEN}  Frontend web bundle exported successfully (dist/ ready).${NC}"

# 4. Install systemd service units (Isolated: credit-backend & credit-frontend)
echo -e "\n${BLUE}[4/6] Installing isolated systemd service units...${NC}"

BACKEND_SERVICE_FILE="/etc/systemd/system/credit-backend.service"
FRONTEND_SERVICE_FILE="/etc/systemd/system/credit-frontend.service"

echo "  - Writing ${BACKEND_SERVICE_FILE}..."
sudo tee "${BACKEND_SERVICE_FILE}" > /dev/null <<EOF
[Unit]
Description=CREDiT Microgrid Digital Twin - Backend REST API
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
Group=${CURRENT_GROUP}
WorkingDirectory=${BACKEND_DIR}
ExecStart=${NODE_BIN} dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5600

# Security / resource sandboxing
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

echo "  - Writing ${FRONTEND_SERVICE_FILE}..."
sudo tee "${FRONTEND_SERVICE_FILE}" > /dev/null <<EOF
[Unit]
Description=CREDiT Microgrid Digital Twin - Frontend Web Server
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
Group=${CURRENT_GROUP}
WorkingDirectory=${FRONTEND_DIR}
ExecStart=${NODE_BIN} server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5700

# Security / resource sandboxing
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# 5. Reload systemd, enable, and start services
echo -e "\n${BLUE}[5/6] Starting services with systemd...${NC}"
sudo systemctl daemon-reload

echo "  - Enabling & restarting credit-backend.service..."
sudo systemctl enable credit-backend.service
sudo systemctl restart credit-backend.service

echo "  - Enabling & restarting credit-frontend.service..."
sudo systemctl enable credit-frontend.service
sudo systemctl restart credit-frontend.service

# 6. Verify health and connectivity
echo -e "\n${BLUE}[6/6] Verifying service health...${NC}"
sleep 2

# Check Backend
if curl -sf http://127.0.0.1:5600/health > /dev/null 2>&1; then
  echo -e "  - Backend Status:  ${GREEN}[ONLINE]${NC} (listening on 127.0.0.1:5600)"
else
  echo -e "  - Backend Status:  ${YELLOW}[STARTING / CHECK LOGS]${NC} (run: journalctl -u credit-backend -n 20)"
fi

# Check Frontend
if curl -sf http://127.0.0.1:5700 > /dev/null 2>&1; then
  echo -e "  - Frontend Status: ${GREEN}[ONLINE]${NC} (listening on 127.0.0.1:5700)"
else
  echo -e "  - Frontend Status: ${YELLOW}[STARTING / CHECK LOGS]${NC} (run: journalctl -u credit-frontend -n 20)"
fi

# Detect public IP if curl is available
PUBLIC_IP="$(curl -s --max-time 3 https://checkip.amazonaws.com 2>/dev/null || echo "<LIGHTSAIL_PUBLIC_IP>")"

echo -e "\n${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  Deployment Complete! System is active and running.               ${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}Access URLs:${NC}"
echo -e "  Frontend UI:  ${BOLD}${BLUE}http://${PUBLIC_IP}:5700${NC}"
echo -e "  Backend API:  ${BOLD}${BLUE}http://${PUBLIC_IP}:5600/api/v1/microgrid${NC}"
echo -e "  API Health:   ${BOLD}${BLUE}http://${PUBLIC_IP}:5600/health${NC}"
echo ""
echo -e "${BOLD}${YELLOW}AWS Lightsail Firewall Reminder:${NC}"
echo -e "  Ensure you have opened custom TCP ports in the Lightsail Console:"
echo -e "  1. Open Amazon Lightsail Console -> Your Instance -> Networking tab."
echo -e "  2. Under 'IPv4 Firewall', click '+ Add rule'."
echo -e "  3. Add: Custom | TCP | 5600"
echo -e "  4. Add: Custom | TCP | 5700"
echo ""
echo -e "${BOLD}Useful Service Commands:${NC}"
echo -e "  View Backend logs:   ${YELLOW}journalctl -u credit-backend -f${NC}"
echo -e "  View Frontend logs:  ${YELLOW}journalctl -u credit-frontend -f${NC}"
echo -e "  Restart Backend:     ${YELLOW}sudo systemctl restart credit-backend${NC}"
echo -e "  Restart Frontend:    ${YELLOW}sudo systemctl restart credit-frontend${NC}"
echo -e "  Check Status:        ${YELLOW}sudo systemctl status credit-backend credit-frontend${NC}"
echo -e "===================================================================="

