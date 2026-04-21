from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission, SAFE_METHODS, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Pet, LostPet, Sighting, Match
from .serializers import PetSerializer, LostPetSerializer, SightingSerializer, MatchSerializer
import requests

try:
    from .imageMatching import match, TORCH_AVAILABLE
except ImportError:
    match = None
    TORCH_AVAILABLE = False


class IsOwnerOrReadOnly(BasePermission):
    """Custom permission: Allow safe methods to anyone, write methods only to the owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return getattr(obj, "owner", None) == request.user


class PetList(generics.ListCreateAPIView):
    """
    Retrieve user's pets or create a new pet.
    - GET: List all pets owned by the authenticated user
    - POST: Create a new pet for the authenticated user
    """
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PetDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific pet.
    - GET: Retrieve pet details
    - PUT/PATCH: Update pet information
    - DELETE: Remove pet from user's collection
    """
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)


class LostPetList(generics.ListCreateAPIView):
    """
    Retrieve all active lost pet reports or create a new one.
    - GET: List all lost pets that have not been found (public list for homepage map)
    - POST: Report a pet as lost with location coordinates
    """
    serializer_class = LostPetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return LostPet.objects.filter(is_found=False)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class LostPetDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a lost pet report.
    - GET: View details of a lost pet (public)
    - PUT/PATCH: Update lost pet info (owner only)
    - DELETE: Remove lost pet report (owner only)
    """
    queryset = LostPet.objects.all()
    serializer_class = LostPetSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return LostPet.objects.all()


class UserLostPetList(generics.ListAPIView):
    """
    Retrieve all lost pet reports created by the current authenticated user.
    Used for the 'My Pets' page to show pets the user has reported as lost.
    """
    serializer_class = LostPetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LostPet.objects.filter(owner=self.request.user)


class UserLostPetDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific lost pet report owned by the user.
    Used to mark pets as found or manage lost pet reports.
    """
    serializer_class = LostPetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LostPet.objects.filter(owner=self.request.user)


class SightingList(generics.ListCreateAPIView):
    """
    Retrieve all pet sightings or report a new sighting.
    - GET: List all pet sightings (public list for homepage map)
    - POST: Report a sighting with location, photo, and details (anonymous or authenticated)
    """
    serializer_class = SightingSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Sighting.objects.all()
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(reporter=self.request.user)
        else:
            anonymous_user, _ = User.objects.get_or_create(username='anonymous')
            serializer.save(reporter=anonymous_user)


class SightingDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific sighting report.
    """
    serializer_class = SightingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Sighting.objects.filter(reporter=self.request.user)


class MatchList(generics.ListCreateAPIView):
    """
    Retrieve all pet matches or create a new AI match.
    Used for Week 10+ AI image similarity matching feature.
    """
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Match.objects.all()


class MatchDetail(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific match.
    Used for Week 10+ AI image similarity matching feature.
    """
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]


class SignupView(generics.CreateAPIView):
    """
    Create a new user account and return JWT authentication tokens.
    - POST: Register a new user with username, password, and optional email
    Returns access token, refresh token, and username on success
    """
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
    permission_classes = [AllowAny]
    
    def post(self, request):
        location = request.data.get('location')
        
        if not location:
            return Response(
                {'error': 'Location is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            response = requests.get(
                'https://nominatim.openstreetmap.org/search',
                params={
                    'q': location,
                    'format': 'json',
                    'limit': 1
                },
                headers={'User-Agent': 'LostPetTracker/1.0'}
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
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FindTopMatches(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, lost_pet_id):
        try:
            lost_pet = LostPet.objects.get(id=lost_pet_id)
        except LostPet.DoesNotExist:
            return Response(
                {'error': 'Lost pet not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        sightings = Sighting.objects.filter(pet_type=lost_pet.pet_type)
        
        if not sightings.exists():
            return Response(
                {'matches': []},
                status=status.HTTP_200_OK
            )
        
        for sighting in sightings:
            match_record, created = Match.objects.get_or_create(
                sighting=sighting,
                lost_pet=lost_pet
            )
            
            if TORCH_AVAILABLE and match:
                try:
                    match_score = match(lost_pet, sighting)
                    match_record.match_score = match_score
                except Exception as e:
                    # If matching fails, set score to 0 and log error
                    match_record.match_score = 0.0
            else:
                # PyTorch not available; set score to 0
                match_record.match_score = 0.0
            match_record.save()
        
        # Get top 5 matches sorted by score (highest first)
        top_matches = Match.objects.filter(
            lost_pet=lost_pet,
            sighting__pet_type=lost_pet.pet_type,
        ).order_by('-match_score')[:5]
        
        serializer = MatchSerializer(top_matches, many=True, context={'request': request})
        return Response(
            {'matches': serializer.data},
            status=status.HTTP_200_OK
        )
