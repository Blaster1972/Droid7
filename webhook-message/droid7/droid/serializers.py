from rest_framework import serializers
from .models import User  # Adjust this import based on your model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # Replace with your actual model name
        fields = '__all__'  # Specify the fields you want to include
