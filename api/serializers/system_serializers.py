from rest_framework import serializers
from api.models import SystemSettings

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        exclude = ['id', 'created_at', 'updated_at']
        
    def to_representation(self, instance):
        """
        Transform the output representation to match the frontend structure
        with sections for general, election, and security settings.
        """
        representation = {
            'general': {
                'siteName': instance.site_name,
                'siteDescription': instance.site_description,
                'contactEmail': instance.contact_email,
                'maintenanceMode': instance.maintenance_mode,
                'maintenanceMessage': instance.maintenance_message,
            },
            'election': {
                'minCandidates': instance.min_candidates,
                'maxCandidates': instance.max_candidates,
                'requireVerification': instance.require_verification,
                'allowElectionEditing': instance.allow_election_editing,
                'timeBeforeStartToLock': instance.time_before_start_to_lock,
            },
            'security': {
                'sessionTimeout': instance.session_timeout,
                'maxLoginAttempts': instance.max_login_attempts,
                'passwordExpiryDays': instance.password_expiry_days,
                'otpExpiryMinutes': instance.otp_expiry_minutes,
                'enforceStrongPasswords': instance.enforce_strong_passwords,
            }
        }
        return representation

    def to_internal_value(self, data):
        """
        Transform the input data from the frontend structure to the database format.
        """
        internal_data = {}
        
        # Process general settings
        if 'general' in data:
            general = data['general']
            if 'siteName' in general:
                internal_data['site_name'] = general['siteName']
            if 'siteDescription' in general:
                internal_data['site_description'] = general['siteDescription']
            if 'contactEmail' in general:
                internal_data['contact_email'] = general['contactEmail']
            if 'maintenanceMode' in general:
                internal_data['maintenance_mode'] = general['maintenanceMode']
            if 'maintenanceMessage' in general:
                internal_data['maintenance_message'] = general['maintenanceMessage']
        
        # Process election settings
        if 'election' in data:
            election = data['election']
            if 'minCandidates' in election:
                internal_data['min_candidates'] = election['minCandidates']
            if 'maxCandidates' in election:
                internal_data['max_candidates'] = election['maxCandidates']
            if 'requireVerification' in election:
                internal_data['require_verification'] = election['requireVerification']
            if 'allowElectionEditing' in election:
                internal_data['allow_election_editing'] = election['allowElectionEditing']
            if 'timeBeforeStartToLock' in election:
                internal_data['time_before_start_to_lock'] = election['timeBeforeStartToLock']
        
        # Process security settings
        if 'security' in data:
            security = data['security']
            if 'sessionTimeout' in security:
                internal_data['session_timeout'] = security['sessionTimeout']
            if 'maxLoginAttempts' in security:
                internal_data['max_login_attempts'] = security['maxLoginAttempts']
            if 'passwordExpiryDays' in security:
                internal_data['password_expiry_days'] = security['passwordExpiryDays']
            if 'otpExpiryMinutes' in security:
                internal_data['otp_expiry_minutes'] = security['otpExpiryMinutes']
            if 'enforceStrongPasswords' in security:
                internal_data['enforce_strong_passwords'] = security['enforceStrongPasswords']
        
        return internal_data