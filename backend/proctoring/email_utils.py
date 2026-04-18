from django.conf import settings
from django.core.mail import send_mail


def send_exam_result_email(user, exam, score, total_marks):
    subject = "Your Exam Result - Trinetra"
    student_name = user.get_full_name() or user.username
    body = (
        f"Hello {student_name},\n\n"
        f"Your exam results are ready.\n\n"
        f"Exam: {exam.title}\n"
        f"Score: {score} / {total_marks}\n\n"
        "If you have any questions, please contact your examiner or admin.\n"
        "\nTrinetra Proctoring"
    )

    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
