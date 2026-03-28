#!/usr/bin/env bash
set -euo pipefail

# ================================
# REQUIRED ENV
# ================================
APP_NAME="${APP_NAME:?APP_NAME not set}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"

# ================================
# CONSTANTS
# ================================
BASE_DIR="/opt/apps"
APP_DIR="$BASE_DIR/$APP_NAME"
MANIFEST="$APP_DIR/codebuild/app.manifest.json"
DEPLOY_USER="ubuntu"

echo "➡ Creating app: $APP_NAME"

cd "$APP_DIR"

# ================================
# READ MANIFEST
# ================================
if [ ! -f "$MANIFEST" ]; then
  echo "❌ Missing codebuild/app.manifest.json"
  exit 1
fi

RUNTIME=$(jq -r '.runtime' "$MANIFEST")
WORKDIR=$(jq -r '.working_dir' "$MANIFEST")
START_CMD=$(jq -r '.start_command' "$MANIFEST")
PORT=$(jq -r '.port' "$MANIFEST")
DOMAIN=$(jq -r '.domain' "$MANIFEST")

APP_WORKDIR="$APP_DIR/$WORKDIR"

if [ ! -d "$APP_WORKDIR" ]; then
  echo "❌ working_dir does not exist: $APP_WORKDIR"
  exit 1
fi

cd "$APP_WORKDIR"

# Ensure app dir is writable so new subdirs can be created at runtime
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_WORKDIR"
chmod -R u+rwX,g+rwX "$APP_WORKDIR"

# ================================
# RUNTIME SETUP
# ================================
if [ "$RUNTIME" = "python" ]; then
  echo "🐍 Python setup with Poetry"

  # Install poetry if missing
  if ! sudo -u "$DEPLOY_USER" command -v poetry &> /dev/null; then
    echo "📥 Installing Poetry"
    sudo -u "$DEPLOY_USER" pipx install poetry || sudo -u "$DEPLOY_USER" python3 -m pip install --user poetry
    export PATH="$PATH:/home/ubuntu/.local/bin"
  fi

  # Configure poetry to create virtualenv in-project
  sudo -u "$DEPLOY_USER" poetry config virtualenvs.in-project true

  # Install dependencies
  sudo -u "$DEPLOY_USER" poetry install --no-root --no-interaction
elif [ "$RUNTIME" = "react" ]; then
  echo "⚛️ React setup with NPM"

  # Check if Node.js is missing or below version 20
  if command -v node &> /dev/null; then
    NODE_MAJOR_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  else
    NODE_MAJOR_VERSION=0
  fi

  if [ "$NODE_MAJOR_VERSION" -lt 20 ]; then
    echo "📥 Installing/Upgrading Node.js to version 20.x (Current: v$NODE_MAJOR_VERSION)"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  # Install dependencies
  sudo -u "$DEPLOY_USER" npm install

  # Build application
  sudo -u "$DEPLOY_USER" npm run build
fi

# ================================
# SYSTEMD (only for server-based runtimes)
# ================================
if [ "$RUNTIME" != "react" ]; then
  echo "🔧 Creating systemd service"
  cat > "/etc/systemd/system/${APP_NAME}.service" <<EOF
[Unit]
Description=${APP_NAME}
After=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_WORKDIR}
UMask=0002

$(if [ "$RUNTIME" = "python" ]; then echo "Environment=PYTHONPATH=${APP_WORKDIR}"; fi)

ExecStart=${APP_WORKDIR}/${START_CMD}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "${APP_NAME}"
  systemctl restart "${APP_NAME}"
else
  echo "⚛️ React app — static files served by nginx, no systemd service needed"
fi

# ================================
# NGINX (GENERATED)
# ================================
echo "🌐 Generating nginx config"

if [ "$RUNTIME" = "react" ]; then
  LOCATION_CONFIG="    root ${APP_WORKDIR}/dist;
    index index.html;
    try_files \$uri \$uri/ /index.html;"
else
  LOCATION_CONFIG="    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;"
fi

cat > "/etc/nginx/sites-available/${DOMAIN}" <<EOF
server {
  listen 80;
  server_name ${DOMAIN};

  location / {
${LOCATION_CONFIG}
  }
}

server {
  listen 443 ssl;
  server_name ${DOMAIN};

  ssl_certificate /etc/nginx/ssl/self.crt;
  ssl_certificate_key /etc/nginx/ssl/self.key;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  location / {
${LOCATION_CONFIG}
  }
}
EOF

ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t
systemctl reload nginx

echo "✅ App created successfully"
