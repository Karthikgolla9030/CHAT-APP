import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class UsernameValidator:
    pattern = re.compile(r'^[a-zA-Z0-9_]{3,30}$')
    message = _('Enter a valid username. This value may contain only letters, numbers, and _ character. 3-30 chars required.')

    def __call__(self, value):
        if not self.pattern.match(value):
            raise ValidationError(self.message, code='invalid')


class AgeValidator:
    pattern = re.compile(r'^(1[89]|[2-9]\d|1[01]\d|120)$')
    message = _('Enter a valid age between 18 and 120.')

    def __call__(self, value):
        if value and not self.pattern.match(str(value)):
            raise ValidationError(self.message, code='invalid')


class BadWordValidator:
    bad_words = ['spam', 'scam', 'hate', 'abuse', 'kill', 'threat', 'illegal']

    def __call__(self, value):
        value_lower = value.lower()
        for word in self.bad_words:
            if word in value_lower:
                raise ValidationError(
                    _('Please remove inappropriate content.'),
                    code='inappropriate'
                )


def validate_profile_completeness(user):
    from accounts.models import Profile
    profile = Profile.objects.filter(user=user).first()
    if not profile:
        return 0

    fields = [
        'username', 'display_name', 'age', 'gender', 'country',
        'languages', 'interests', 'bio', 'profile_picture', 'looking_for'
    ]
    filled = 0
    for field in fields:
        val = getattr(profile, field)
        if val and str(val).strip():
            filled += 1
    return int((filled / len(fields)) * 100)


def sanitize_html(value):
    import bleach
    return bleach.clean(
        value,
        tags=['p', 'br', 'b', 'i', 'u', 'strong', 'em'],
        attributes={'a': ['href', 'title']},
        strip=True,
    )
