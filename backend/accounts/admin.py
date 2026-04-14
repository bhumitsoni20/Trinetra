from django.contrib import admin
from .models import OTP, AdminAccount

admin.site.register(OTP)
admin.site.register(AdminAccount)
