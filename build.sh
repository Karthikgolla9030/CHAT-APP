#!/usr/bin/env bash
# exit on error
set -o errexit

if [ -d "backend" ]; then
    echo "=== Executing backend build from root directory ==="
    cd backend
fi

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate
