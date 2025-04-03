class AuthRouter:
    """
    A router to control database operations for the authentication database.
    This ensures that models in the verification app use the auth_db database.
    """
    
    route_app_labels = {'verification'}
    
    def db_for_read(self, model, **hints):
        """Point all read operations to auth_db for verification app."""
        if model._meta.app_label in self.route_app_labels:
            return 'auth_db'
        return None

    def db_for_write(self, model, **hints):
        """Point all write operations to auth_db for verification app."""
        if model._meta.app_label in self.route_app_labels:
            return 'auth_db'
        return None
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if models in verification app."""
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure verification app models go to auth_db."""
        if app_label in self.route_app_labels:
            return db == 'auth_db'
        return None