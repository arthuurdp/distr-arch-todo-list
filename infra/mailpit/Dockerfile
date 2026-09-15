# Fake SMTP server with a web inbox: every email sent by the notification-worker is caught here instead of delivered.
# SMTP on port 1025 (internal), web UI on port 8025. The image already defines a healthcheck (mailpit readyz).
FROM axllent/mailpit:v1.29

EXPOSE 1025 8025
