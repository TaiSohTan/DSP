from django.dispatch import Signal

# Custom signal that will be sent when a user is verified
user_verified = Signal()  # provides ['user', 'verification_data']
