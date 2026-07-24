from django.apps import AppConfig


class FriendsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'friends'
    verbose_name = 'Friends'

    def ready(self):
        import friends.signals
