import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'omniroute.settings')

app = Celery('omniroute')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
