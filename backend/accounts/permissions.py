from rest_framework import permissions
from .models import AdminAccount

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to users who are present in the AdminAccount database table.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        return AdminAccount.objects.filter(email=request.user.email).exists()
