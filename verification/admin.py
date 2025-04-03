from django.contrib import admin
from .models import VerificationUser

@admin.register(VerificationUser)
class VerificationUserAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'government_id', 'government_id_type', 'email', 'phone_number', 'is_eligible_voter')
    list_filter = ('is_eligible_voter', 'government_id_type', 'country', 'verification_date')
    search_fields = ('full_name', 'government_id', 'email', 'phone_number')
    readonly_fields = ('id', 'verification_date')
    fieldsets = (
        ('Personal Information', {
            'fields': ('id', 'full_name', 'date_of_birth', 'government_id', 'government_id_type')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone_number', 'address', 'postal_code', 'city', 'country')
        }),
        ('Verification Status', {
            'fields': ('is_eligible_voter', 'verification_date')
        }),
    )
