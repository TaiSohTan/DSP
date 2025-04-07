from django.contrib import admin
from .models import EthereumWallet, Election, Vote

@admin.register(EthereumWallet)
class EthereumWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'address', 'created_at')
    search_fields = ('user__username', 'user__email', 'address')
    readonly_fields = ('id', 'user', 'address', 'encrypted_private_key', 'salt', 'created_at', 'updated_at')
    
    def has_add_permission(self, request):
        return False  # Prevent manual creation


@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_date', 'end_date', 'status', 'is_published', 'is_deployed')
    list_filter = ('is_published', 'is_deployed', 'start_date', 'end_date')
    search_fields = ('title', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Election Information', {
            'fields': ('id', 'title', 'description', 'start_date', 'end_date', 'created_by')
        }),
        ('Status', {
            'fields': ('is_published', 'is_deployed', 'smart_contract_address')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('voter', 'election', 'timestamp', 'transaction_hash')
    list_filter = ('election', 'timestamp')
    search_fields = ('voter__username', 'voter__email', 'transaction_hash', 'receipt_hash')
    readonly_fields = ('id', 'voter', 'election', 'transaction_hash', 'receipt_hash', 'timestamp')
    
    def has_add_permission(self, request):
        return False  # Prevent manual creation
    
    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing
