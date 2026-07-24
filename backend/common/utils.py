import random
import string
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def generate_random_username(prefix="Guest_"):
    clean_prefix = "".join(c for c in prefix if c.isalnum() or c == "_")
    if not clean_prefix:
        clean_prefix = "Guest"
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{clean_prefix}_{random_str}"[:30]

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {"detail": "An unexpected error occurred on the server.", "error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return response
