from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Exam, ExamAttempt, ExamSession, ProctoringLog, Profile, Question


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("role", "subject")


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "subject", "is_active")

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return "student"

    def get_subject(self, obj):
        try:
            return obj.profile.subject or ""
        except Profile.DoesNotExist:
            return ""


class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)
    subject = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "is_active", "role", "subject")
        read_only_fields = ("id",)

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        subject = validated_data.pop("subject", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if role is not None or subject is not None:
            profile, _ = Profile.objects.get_or_create(user=instance)
            if role is not None:
                profile.role = role
            if subject is not None:
                profile.subject = subject or ""
            profile.save()
        return instance


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    role = serializers.ChoiceField(choices=["student", "admin", "examiner"], default="student")
    subject = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")

    def validate(self, attrs):
        role = attrs.get("role", "student")
        subject = (attrs.get("subject") or "").strip()
        if role == "examiner" and not subject:
            raise serializers.ValidationError({"subject": "Subject is required for examiner accounts."})
        return attrs

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
        subject = validated_data.pop("subject", "")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        Profile.objects.create(user=user, role=role, subject=subject or "")
        return user


class ExamSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    exam_id = serializers.IntegerField(source="exam.id", read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    exam_subject = serializers.CharField(source="exam.subject", read_only=True)

    class Meta:
        model = ExamSession
        fields = (
            "id", "username", "email", "exam_id", "exam_title", "exam_subject",
            "start_time", "end_time", "violations_count", "tab_switch_count",
            "status", "time_remaining",
        )


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "question_text", "options", "correct_answer", "marks", "order")


class QuestionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "question_text", "options", "marks", "order")


class ExamListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    allowed_count = serializers.IntegerField(source="allowed_students.count", read_only=True)

    class Meta:
        model = Exam
        fields = (
            "id", "title", "subject", "duration", "total_marks",
            "created_by_name", "allowed_count", "created_at",
        )


class ExamDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(source="question_items", many=True)
    allowed_students = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Exam
        fields = (
            "id", "title", "subject", "duration", "total_marks",
            "created_by", "created_by_name", "allowed_students", "questions", "created_at",
        )


class ExamStudentSerializer(serializers.ModelSerializer):
    questions = QuestionStudentSerializer(source="question_items", many=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Exam
        fields = (
            "id", "title", "subject", "duration", "total_marks",
            "created_by_name", "questions", "created_at",
        )


class ExamAttemptSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)

    class Meta:
        model = ExamAttempt
        fields = ("id", "user", "user_name", "exam", "exam_title", "score", "answers", "submitted_at")


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

