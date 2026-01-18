import sendgrid
from sendgrid.helpers.mail import Mail
from app.config import settings

def send_email(to: str, subject: str, body: str):
    if not settings.SENDGRID_API_KEY:
        print(f"[DEV] Email -> {to}: {subject}\n{body}")
        return
    sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    msg = Mail(
        from_email="no-reply@example.com",
        to_emails=to,
        subject=subject,
        html_content=f"<p>{body}</p>",
    )
    sg.send(msg)