from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication


class UserHeaderAuthentication(BaseAuthentication):
    """
    Authenticate via Authorization: User <id>
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("User "):
            return None

        user_id = auth_header.split(" ", 1)[1].strip()
        if not user_id:
            return None

        try:
            user_id = int(user_id)
        except ValueError:
            return None

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

        return (user, None)
