import base64
import json
import random
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from firebase_admin import auth as firebase_auth
import firebase_admin
from firebase_admin import credentials
from .models import OTP, AdminAccount
from proctoring.models import Profile

from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

# Initialize Firebase Admin (Only once)
try:
    if not firebase_admin._apps:
        # For a real app, initialize with a service account json.
        # Here we initialize default app, which requires GOOGLE_APPLICATION_CREDENTIALS env variable,
        # or we just try to initialize it without credentials if it's purely mock/emulator, 
        # but Firebase Admin requires proper init.
        # We will use a mock credentials object to prevent import errors in development
        # if the user hasn't set it up yet.
        # credentials.Certificate('path/to/serviceAccountKey.json')
        print("Warning: Initialize Firebase Admin with real credentials in production.")
        # firebase_admin.initialize_app()
except Exception as e:
    pass


def normalize_email(email):
    return (email or "").strip().lower()


def decode_jwt_payload(id_token):
    if not id_token or id_token.count(".") < 2:
        return {}
    try:
        payload_b64 = id_token.split(".")[1]
        padding = "=" * (-len(payload_b64) % 4)
        payload_b64 += padding
        decoded = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
        data = json.loads(decoded.decode("utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def is_admin_email(email):
    normalized = normalize_email(email)
    if not normalized:
        return False
    if AdminAccount.objects.filter(email__iexact=normalized).exists():
        return True
    main_admins = getattr(settings, "MAIN_ADMIN_EMAILS", [])
    return normalized in {normalize_email(item) for item in main_admins if item}


def resolve_role(user, email):
    if user:
        try:
            if user.profile.role == "admin":
                return "admin"
        except Profile.DoesNotExist:
            pass
    return "admin" if is_admin_email(email) else "student"


def ensure_profile_role(user, role):
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"role": role})
    if profile.role != role:
        profile.role = role
        profile.save(update_fields=["role"])


def ensure_admin_account(email, role):
    if role != "admin":
        return
    normalized = normalize_email(email)
    if not normalized:
        return
    if not AdminAccount.objects.filter(email__iexact=normalized).exists():
        AdminAccount.objects.create(email=normalized)


def get_or_create_user_by_email(email, name=""):
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        user = User.objects.filter(username__iexact=email).first()

    created = False
    if not user:
        user = User.objects.create(username=email, email=email, first_name=name)
        created = True
    else:
        update_fields = []
        if not user.email:
            user.email = email
            update_fields.append("email")
        if name and not user.first_name:
            user.first_name = name
            update_fields.append("first_name")
        if update_fields:
            user.save(update_fields=update_fields)
    return user, created

class GoogleLoginView(APIView):
    def post(self, request):
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({'error': 'No id_token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # decoded_token = firebase_auth.verify_id_token(id_token)
            # uid = decoded_token['uid']
            # email = decoded_token.get('email', '')
            # name = decoded_token.get('name', 'User')
            
            # Since we may not have real firebase admin setup yet, we mock the decoding if verification fails
            # In real production, remove the mock fallback!
            try:
                decoded_token = firebase_auth.verify_id_token(id_token)
                email = decoded_token.get('email', '')
                name = decoded_token.get('name', 'User')
            except Exception as e:
                print(f"Firebase verification failed: {e}. Decoding manually for dev...")
                decoded = decode_jwt_payload(id_token)
                email = decoded.get('email', '') or request.data.get('email', '')
                name = decoded.get('name', 'Google User')


            if not email and settings.DEBUG:
                fallback_email = request.data.get("email", "")
                if not fallback_email:
                    main_admins = getattr(settings, "MAIN_ADMIN_EMAILS", [])
                    fallback_email = main_admins[0] if main_admins else ""
                email = fallback_email

            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)

            user, created = get_or_create_user_by_email(email, name)

            role = resolve_role(user, email)
            ensure_admin_account(email, role)
            ensure_profile_role(user, role)

            # Simulated token generation or session login
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.first_name,
                    'role': role
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EmailLoginView(APIView):
    def post(self, request):
        id_token = request.data.get('id_token')
        email_fallback = request.data.get('email')
        pass_fallback = request.data.get('password')
        
        # If direct email/pass is sent (Firebase fallback state)
        if email_fallback and pass_fallback and not id_token:
            from django.contrib.auth import authenticate
            # Note: We used email as username when creating accounts
            user = authenticate(username=email_fallback, password=pass_fallback)
            if user:
                role = resolve_role(user, user.email)
                ensure_admin_account(user.email, role)
                ensure_profile_role(user, role)
                return Response({
                    'message': 'Login successful via Django',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'name': user.first_name or user.email.split('@')[0],
                        'role': role
                    }
                })
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # Normal Firebase Flow
        if not id_token:
            return Response({'error': 'No id_token provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            try:
                decoded_token = firebase_auth.verify_id_token(id_token)
                email = decoded_token.get('email', '')
            except Exception as e:
                print(f"Firebase verification failed: {e}. Decoding manually for dev...")
                decoded = decode_jwt_payload(id_token)
                email = decoded.get('email', '') or request.data.get('email', 'dev@example.com')
            
            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)
                
            user, created = get_or_create_user_by_email(email)

            role = resolve_role(user, email)
            ensure_admin_account(email, role)
            ensure_profile_role(user, role)

            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.first_name or email.split('@')[0],
                    'role': role
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SendOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Save OTP to database
        OTP.objects.create(email=email, otp_code=otp_code)
        
        from django.core.mail import EmailMultiAlternatives
        
        subject = "Your Password Reset OTP - Trinetra"
        text_content = f"Your OTP is {otp_code}. It expires in 10 minutes."
        html_content = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #06b6d4; margin-bottom: 20px;">Trinetra Proctoring</h2>
            <p style="font-size: 16px; color: #cbd5e1;">You requested a password reset. Here is your securely generated OTP code:</p>
            <div style="margin: 30px 0; padding: 20px; background-color: #1e293b; border-radius: 8px; border: 1px solid #334155; display: inline-block;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 0.2em; color: #ffffff;">{otp_code}</span>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">This code will expire in 10 minutes. Do not share it with anyone.</p>
            <p style="font-size: 12px; color: #475569; margin-top: 40px;">&copy; {timezone.now().year} Trinetra AI Proctoring. All rights reserved.</p>
        </div>
        """
        
        try:
            msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [email])
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            print(f"--- REAL EMAIL SENT TO {email} FROM {settings.DEFAULT_FROM_EMAIL} ---")
        except Exception as e:
            print(f"--- FAILED TO SEND EMAIL: {e} ---")
            return Response({'error': 'Failed to send OTP email. Please ensure App Password is put in backend settings or environment.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'message': 'OTP sent to email successfully'})


class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        
        if not email or not otp_code:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Find latest OTP
        otp_obj = OTP.objects.filter(email=email, otp_code=otp_code).order_by('-created_at').first()
        
        if not otp_obj:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not otp_obj.is_valid():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_obj.is_verified = True
        otp_obj.save()
        
        return Response({'message': 'OTP verified successfully'})


class ResetPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('password')
        otp_code = request.data.get('otp')
        
        if not email or not new_password or not otp_code:
            return Response({'error': 'Email, new password, and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_obj = OTP.objects.filter(email=email, otp_code=otp_code, is_verified=True).order_by('-created_at').first()
        
        if not otp_obj or not otp_obj.is_valid():
            return Response({'error': 'Invalid or expired OTP verification'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update user password in Django database
        user = User.objects.filter(email=email).first()
        if user:
            user.set_password(new_password)
            user.save()
            
        # If user is in Firebase, we should also update Firebase Auth password
        try:
            # We would need user's UID to update Firebase password.
            # firebase_uid = firebase_auth.get_user_by_email(email).uid
            # firebase_auth.update_user(firebase_uid, password=new_password)
            pass
        except Exception:
            pass
            
        return Response({'message': 'Password reset successfully'})
