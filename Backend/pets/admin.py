from django.contrib import admin
from .models import Pet, LostPet, Sighting, Match

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ['name', 'pet_type', 'owner', 'created_at']
    list_filter = ['pet_type', 'created_at']
    search_fields = ['name', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(LostPet)
class LostPetAdmin(admin.ModelAdmin):
    list_display = ['name', 'pet_type', 'owner', 'date_lost', 'is_found']
    list_filter = ['pet_type', 'is_found', 'date_lost']
    search_fields = ['name', 'owner__username', 'location_lost']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Sighting)
class SightingAdmin(admin.ModelAdmin):
    list_display = ['lost_pet', 'reporter', 'date_sighted', 'confidence']
    list_filter = ['date_sighted', 'confidence']
    search_fields = ['lost_pet__name', 'reporter__username', 'location']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['lost_pet', 'sighting', 'status', 'match_score']
    list_filter = ['status', 'match_score']
    search_fields = ['lost_pet__name', 'sighting__location']
    readonly_fields = ['created_at', 'updated_at']
