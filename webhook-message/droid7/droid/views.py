from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer  # Assume you've created this serializer

# Create your views here.
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello, World! This is my first Django app.")

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        # Custom update logic if necessary, otherwise inherit from ModelViewSet
        return super().update(request, *args, **kwargs)
