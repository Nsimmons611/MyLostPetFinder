from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission, SAFE_METHODS, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Pet, LostPet, Sighting, Match
from .serializers import PetSerializer, LostPetSerializer, SightingSerializer, MatchSerializer
import requests


class IsOwnerOrReadOnly(BasePermission):
    """Allow safe methods to anyone, but write methods only to the owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # For non-safe methods, only the owner may modify
        return getattr(obj, "owner", None) == request.user


class PetList(generics.ListCreateAPIView):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PetDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)


class LostPetList(generics.ListCreateAPIView):
    queryset = LostPet.objects.all()
    serializer_class = LostPetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class LostPetDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = LostPet.objects.all()
    serializer_class = LostPetSerializer
    permission_classes = [IsOwnerOrReadOnly]

    # Allow anyone to retrieve; IsOwnerOrReadOnly will restrict updates/deletes
    def get_queryset(self):
        return LostPet.objects.all()


class SightingList(generics.ListCreateAPIView):
    serializer_class = SightingSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Sighting.objects.all()
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(reporter=self.request.user)
        else:
            # For anonymous users, create or get an anonymous user
            anonymous_user, _ = User.objects.get_or_create(username='anonymous')
            serializer.save(reporter=anonymous_user)


class SightingDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SightingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Sighting.objects.filter(reporter=self.request.user)


class MatchList(generics.ListCreateAPIView):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Match.objects.all()


class MatchDetail(generics.RetrieveUpdateAPIView):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]


class SignupView(generics.CreateAPIView):
    """Create a new user account"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email
            )
            
            # Generate token for the new user using JWT
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class GeocodeView(APIView):
    """Geocode a location string to coordinates"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        location = request.data.get('location')
        
        if not location:
            return Response(
                {'error': 'Location is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use Nominatim for geocoding (no API key needed)
            response = requests.get(
                'https://nominatim.openstreetmap.org/search',
                params={
                    'q': location,
                    'format': 'json',
                    'limit': 1
                },
                headers={'User-Agent': 'LostPetTracker/1.0'},
                timeout=10
            )
            
            # Check response status
            if response.status_code != 200:
                print(f"Nominatim returned status {response.status_code}: {response.text}")
                return Response(
                    {'error': f'Nominatim returned status {response.status_code}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                return Response({
                    'lat': float(result['lat']),
                    'lng': float(result['lon']),
                    'display_name': result.get('display_name', location)
                })
            else:
                return Response(
                    {'error': 'Location not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            print(f"GeocodeView error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )