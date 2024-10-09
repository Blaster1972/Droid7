# Create your models here.
from django.db import models
# from django.contrib.postgres.fields import JSONField
from django.db.models import JSONField  # Use the generic JSONField for MySQL
from django.utils import timezone

class Item(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.name

class User(models.Model):
    mixitup_user_id = models.CharField(max_length=100, null=True)
    notes = models.TextField(null=True)
    custom_title = models.CharField(max_length=100, null=True)
    last_updated = models.DateTimeField(null=True)
    last_activity = models.DateTimeField(null=True)
    currency_amounts = JSONField(null=True)  # Store currency amounts as a JSON object
    inventory_amounts = JSONField(null=True)  # Store inventory amounts as a JSON object
    stream_pass_amounts = JSONField(null=True)  # Store stream pass amounts as a JSON object
    is_specialty_excluded = models.BooleanField(default=False, null=True)
    online_viewing_minutes = models.IntegerField(null=True)
    
    # Platform data as a JSON object
    platform_data = JSONField(null=True)  # Represents the nested platform data
    
    # Flattened properties
    platform = models.CharField(max_length=100, null=True)  # Optional
    username = models.CharField(max_length=100, null=True)  # Optional
    display_name = models.CharField(max_length=100, null=True)  # Optional
    avatar_link = models.URLField(null=True)  # Optional
    account_date = models.DateTimeField(null=True)  # Optional
    follow_date = models.DateTimeField(null=True)  # Optional
    subscribe_date = models.DateTimeField(null=True)  # Optional
    subscriber_tier = models.IntegerField(null=True)  # Optional

    # Meta options can be added if needed
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.display_name} ({self.mixitup_user_id})"