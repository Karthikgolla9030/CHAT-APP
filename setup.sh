#!/bin/bash
set -e

echo "Creating virtual environment..."
python -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Setting up database..."
python manage.py makemigrations
python manage.py migrate

echo "Creating superuser..."
python manage.py createsuperuser

echo "Setup complete! Run: python manage.py runserver"
