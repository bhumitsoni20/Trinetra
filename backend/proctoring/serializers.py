from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ExamSession, ProctoringLog, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("role",)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "is_active")

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return "student"


class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "is_active", "role")
        read_only_fields = ("id",)

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if role:
            profile, _ = Profile.objects.get_or_create(user=instance)
            profile.role = role
            profile.save()
        return instance


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    role = serializers.ChoiceField(choices=["student", "admin"], default="student")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role", "student")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        Profile.objects.create(user=user, role=role)
        return user


class ExamSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ExamSession
        fields = (
            "id", "username", "email", "start_time", "end_time",
            "violations_count", "tab_switch_count", "status", "time_remaining",
        )


class ProctoringLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProctoringLog
        fields = (
            "id", "user_label", "username", "email", "event",
            "risk_score", "timestamp", "image_url",
        )

    def get_username(self, obj):
        try:
            if obj.user_id and obj.user:
                return obj.user.username
        except Exception:
            pass
        return obj.user_label or ""

    def get_email(self, obj):
        try:
            if obj.user_id and obj.user:
                return obj.user.email
        except Exception:
            pass
        return ""

    def get_image_url(self, obj):
        try:
            if obj.image:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
        except Exception:
            pass
        return None

