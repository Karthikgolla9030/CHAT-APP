from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile, GuestConversion

User = get_user_model()


@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, username=instance.username)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()


@receiver(post_save, sender=User)
def create_guest_conversion(sender, instance, created, **kwargs):
    if created and instance.is_guest:
        GuestConversion.objects.create(guest_user=instance)
