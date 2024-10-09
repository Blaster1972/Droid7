from django.contrib import admin
from .models import Item  # Import your models here
from .models import User  # Import the User model only

# Customize the admin site title and header
admin.site.site_header = "My Droid Administration"
admin.site.site_title = "My Droid Admin"
admin.site.index_title = "Welcome to My Droid Admin"

# Register the User model
admin.site.register(User)

# Create an admin class for your Item model
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')  # Columns to display in the list view
    search_fields = ('name',)  # Enable search on this field
    list_filter = ('name',)  # Add a filter sidebar for this field

# Register your Item model with the custom admin class
admin.site.register(Item, ItemAdmin)

# If you want to add custom URLs or further customization, you can create a custom admin site class
# But for now, it seems unnecessary if you're not using it
