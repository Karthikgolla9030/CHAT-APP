#!/usr/bin/env bash
# exit on error
set -o errexit

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

echo "=== Building React Frontend ==="
if [ -d "$ROOT_DIR/frontend" ]; then
    cd "$ROOT_DIR/frontend"
    npm install
    npm run build
fi

echo "=== Building Django Backend ==="
cd "$SCRIPT_DIR"

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate
