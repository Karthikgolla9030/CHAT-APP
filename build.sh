#!/usr/bin/env bash
# exit on error
set -o errexit

ROOT_DIR=$(pwd)

echo "=== 1/2 Building React Frontend ==="
if [ -d "$ROOT_DIR/frontend" ]; then
    cd "$ROOT_DIR/frontend"
    npm install
    npm run build
fi

echo "=== 2/2 Building Django Backend ==="
if [ -d "$ROOT_DIR/backend" ]; then
    cd "$ROOT_DIR/backend"
fi

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate
