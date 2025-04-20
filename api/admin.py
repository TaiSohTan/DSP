from django.contrib import admin
from .models import User, Election, Candidate, Vote

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'government_id', 'role', 'is_verified', 'is_eligible_to_vote', 'can_vote')
    list_filter = ('role', 'is_verified', 'is_active', 'is_eligible_to_vote', 'government_id_type')
    search_fields = ('email', 'full_name', 'government_id', 'phone_number')
    fieldsets = (
        ('User Information', {
            'fields': ('email', 'full_name', 'government_id', 'government_id_type', 'phone_number', 'system_username')
        }),
        ('Address', {
            'fields': ('address', 'postal_code', 'city', 'country')
        }),
        ('Status and Permissions', {
            'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser', 'role', 'is_eligible_to_vote', 'cooldown_end_date')
        }),
        ('Ethereum Information', {
            'fields': ('ethereum_address', 'ethereum_private_key')
        }),
        ('Statistics', {
            'fields': ('votes_cast', 'account_creation_date', 'last_activity')
        }),
        ('Dates', {
            'fields': ('date_joined', 'last_login')
        }),
    )
    readonly_fields = ('account_creation_date', 'last_activity')

# UserProfileAdmin removed as we've merged the User and UserProfile models

@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_date', 'end_date', 'is_active', 'contract_address')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('title', 'description')
    fieldsets = (
        ('Election Information', {
            'fields': ('title', 'description', 'start_date', 'end_date')
        }),
        ('Blockchain', {
            'fields': ('contract_address', 'is_active')
        }),
        ('Administration', {
            'fields': ('created_by',)
        }),
    )

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'election', 'blockchain_id')
    list_filter = ('election',)
    search_fields = ('name', 'description', 'election__title')

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('voter', 'election', 'candidate', 'timestamp', 'is_confirmed')
    list_filter = ('election', 'is_confirmed', 'timestamp')
    search_fields = ('voter__email', 'voter__full_name', 'election__title')
    readonly_fields = ('voter', 'election', 'candidate', 'timestamp', 'transaction_hash')
