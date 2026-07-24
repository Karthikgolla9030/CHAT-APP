from .models import Report, BlockedWord
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


def create_report(reporter, reported_user, reason, description=''):
    return Report.objects.create(reporter=reporter, reported_user=reported_user, reason=reason, description=description)


def get_open_reports():
    return Report.objects.filter(status='open')


def resolve_report(report_id, status, admin_notes=''):
    report = Report.objects.filter(id=report_id).first()
    if report:
        report.status = status
        report.admin_notes = admin_notes
        report.save()
        return report
    return None


def load_blocked_words():
    return list(BlockedWord.objects.filter(is_active=True).values_list('word', flat=True))


def contains_bad_word(text):
    words = load_blocked_words()
    text_lower = text.lower()
    return any(word in text_lower for word in words)
