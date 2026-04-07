from django.urls import path
from .views import (
    PetList, PetDetail,
    LostPetList, LostPetDetail, UserLostPetList, UserLostPetDetail,
    SightingList, SightingDetail,
    MatchList, MatchDetail,
    GeocodeView
)

urlpatterns = [
    # Lost Pet endpoints
    path('api/lostpets/', LostPetList.as_view(), name='lostpet-list'),
    path('api/lostpets/<int:pk>/', LostPetDetail.as_view(), name='lostpet-detail'),
    path('api/my-lost-pets/', UserLostPetList.as_view(), name='user-lostpet-list'),
    path('api/my-lost-pets/<int:pk>/', UserLostPetDetail.as_view(), name='user-lostpet-detail'),
    
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

