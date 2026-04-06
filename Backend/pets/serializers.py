from rest_framework import serializers
from .models import Pet, LostPet, Sighting, Match


class PetSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Pet
        fields = ['id', 'name', 'pet_type', 'description', 'photo', 'owner', 'owner_username', 'created_at', 'updated_at']
        read_only_fields = ['owner', 'created_at', 'updated_at']


class LostPetSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    sighting_count = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    
    class Meta:
        model = LostPet
        fields = ['id', 'owner', 'owner_username', 'pet', 'name', 'pet_type', 'description', 'location_lost', 'date_lost', 'is_found', 'photo', 'sighting_count', 'created_at', 'updated_at']
        read_only_fields = ['owner', 'created_at', 'updated_at']
    
    def get_sighting_count(self, obj):
        return obj.sightings.count()
    
    def get_photo(self, obj):
        """Get photo from related Pet object if available"""
        if obj.pet and obj.pet.photo:
            request = self.context.get('request')
            photo_url = obj.pet.photo.url
            # Remove duplicate pet_photos/ prefix if it exists
            if photo_url.startswith('/pet_photos/pet_photos/'):
                photo_url = photo_url.replace('/pet_photos/pet_photos/', '/pet_photos/')
            if request:
                return request.build_absolute_uri(photo_url)
            return photo_url
        return None


class SightingSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    lost_pet_name = serializers.CharField(source='lost_pet.name', read_only=True)
    
    class Meta:
        model = Sighting
        fields = ['id', 'reporter', 'reporter_username', 'lost_pet', 'lost_pet_name', 'location', 'description', 'photo', 'date_sighted', 'confidence', 'created_at', 'updated_at']
        read_only_fields = ['reporter', 'created_at', 'updated_at']


class MatchSerializer(serializers.ModelSerializer):
    sighting_details = SightingSerializer(source='sighting', read_only=True)
    lost_pet_name = serializers.CharField(source='lost_pet.name', read_only=True)
    
    class Meta:
        model = Match
        fields = ['id', 'sighting', 'sighting_details', 'lost_pet', 'lost_pet_name', 'status', 'match_score', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']