import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_proctoring.settings')
django.setup()

from django.contrib.auth.models import User
from proctoring.models import Profile

# Create admin
if not User.objects.filter(username='admin').exists():
    admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    profile, created = Profile.objects.get_or_create(user=admin_user)
    profile.role = 'admin'
    profile.save()
    print("Admin user created (admin / admin)")
else:
    print("Admin user already exists")

# Create a student
if not User.objects.filter(username='student').exists():
    student_user = User.objects.create_user('student', 'student@example.com', 'student')
    profile, created = Profile.objects.get_or_create(user=student_user)
    profile.role = 'student'
    profile.save()
    print("Student user created (student / student)")
else:
    print("Student user already exists")
