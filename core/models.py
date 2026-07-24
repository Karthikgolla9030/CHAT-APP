from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class UUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        import uuid
        if not self.id:
            self.id = uuid.uuid4()
        super().save(*args, **kwargs)
