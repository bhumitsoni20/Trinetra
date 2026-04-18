from django.db import OperationalError
from rest_framework import permissions

from accounts.models import AdminAccount
from .models import Profile


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to users with an admin role or matching AdminAccount.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        try:
            if user.profile.role == "admin":
                return True
        except (Profile.DoesNotExist, OperationalError):
            pass

        return AdminAccount.objects.filter(email=user.email).exists()


class IsAdminOrExaminer(permissions.BasePermission):
    """
    Allows access to admins or examiners.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        try:
            return user.profile.role in {"admin", "examiner"}
        except (Profile.DoesNotExist, OperationalError):
            return AdminAccount.objects.filter(email=user.email).exists()


class IsStudentUser(permissions.BasePermission):
    """
    Allows access only to users with a student role.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        try:
            return user.profile.role == "student"
        except (Profile.DoesNotExist, OperationalError):
            return False
