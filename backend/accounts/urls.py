from django.urls import path
from .views import (
    GoogleLoginView,
    EmailLoginView,
    SendOTPView,
    VerifyOTPView,
    ResetPasswordView
)

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('login/', EmailLoginView.as_view(), name='email_login'),
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]
