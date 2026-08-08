from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Message)
def notify_new_message(sender, instance, created, **kwargs):
    if created and instance.room.room_type == 'friend':
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
            
        partner_id = instance.room.user1_id if instance.sender_id == instance.room.user2_id else instance.room.user2_id
        
        # We push to the global notifications_ group of the partner
        group_name = f"notifications_{partner_id}"
        
        payload = {
            'type': 'send_notification',
            'data': {
                'type': 'new_message',
                'sender_id': instance.sender_id,
                'room_id': str(instance.room.id),
                'content': instance.content,
                'created_at': instance.created_at.isoformat()
            }
        }
        
        try:
            async_to_sync(channel_layer.group_send)(group_name, payload)
        except Exception as e:
            logger.error(f"Failed to push new_message notification: {e}")
