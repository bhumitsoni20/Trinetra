import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_proctoring.settings')
django.setup()

from django.contrib.auth.models import User
from proctoring.models import Profile

ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'admin123'
STUDENT_EMAIL = 'student@example.com'
STUDENT_PASSWORD = 'student123'


def ensure_user(username, email, password, role, is_staff=False, is_superuser=False):
    user = User.objects.filter(username=username).first()
    if user is None:
        user = User.objects.filter(email=email).first()

    created = user is None
    if created:
        user = User(username=username)

    user.username = username
    user.email = email
    user.is_staff = is_staff
    user.is_superuser = is_superuser
    user.is_active = True
    user.set_password(password)
    user.save()

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.save()

    status = 'created' if created else 'updated'
    print(f"{role.capitalize()} user {status} ({email} / {password})")


ensure_user(
    username='admin',
    email=ADMIN_EMAIL,
    password=ADMIN_PASSWORD,
    role='admin',
    is_staff=True,
    is_superuser=True,
)

ensure_user(
    username='student',
    email=STUDENT_EMAIL,
    password=STUDENT_PASSWORD,
    role='student',
)
