from django.urls import path
from .views import (
    PetList, PetDetail,
    LostPetList, LostPetDetail,
    SightingList, SightingDetail,
    MatchList, MatchDetail,
    GeocodeView
)

urlpatterns = [
    # Pet endpoints
    path('api/pets/', LostPetList.as_view(), name='lostpet-list'),
    path('api/pets/<int:pk>/', LostPetDetail.as_view(), name='lostpet-detail'),
    
    # Owned Pet endpoints
    path('api/owned-pets/', PetList.as_view(), name='pet-list'),
    path('api/owned-pets/<int:pk>/', PetDetail.as_view(), name='pet-detail'),
    
    # Sighting endpoints
    path('api/sightings/', SightingList.as_view(), name='sighting-list'),
    path('api/sightings/<int:pk>/', SightingDetail.as_view(), name='sighting-detail'),
    
    # Match endpoints
    path('api/matches/', MatchList.as_view(), name='match-list'),
    path('api/matches/<int:pk>/', MatchDetail.as_view(), name='match-detail'),
    
    # Geocoding endpoint
    path('api/geocode/', GeocodeView.as_view(), name='geocode'),
]

