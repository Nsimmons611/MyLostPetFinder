from rest_framework import serializers
from .models import Pet, LostPet, Sighting, Match


class PetSerializer(serializers.ModelSerializer):
    ownerUsername = serializers.CharField(source='owner.username', read_only=True)
    petType = serializers.CharField(source='pet_type')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Pet
        fields = ['id', 'name', 'petType', 'description', 'photo', 'owner', 'ownerUsername', 'createdAt', 'updatedAt']
        read_only_fields = ['owner', 'createdAt', 'updatedAt']


class LostPetSerializer(serializers.ModelSerializer):
    ownerUsername = serializers.CharField(source='owner.username', read_only=True)
    sightingCount = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    petType = serializers.CharField(source='pet_type')
    locationLost = serializers.CharField(source='location_lost')
    dateLost = serializers.DateTimeField(source='date_lost')
    isFound = serializers.BooleanField(source='is_found')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    pet = serializers.PrimaryKeyRelatedField(queryset=Pet.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = LostPet
        fields = ['id', 'owner', 'ownerUsername', 'pet', 'name', 'petType', 'description', 'locationLost', 'dateLost', 'isFound', 'photo', 'sightingCount', 'latitude', 'longitude', 'createdAt', 'updatedAt']
        read_only_fields = ['owner', 'createdAt', 'updatedAt']
    
    def to_internal_value(self, data):
        """Convert date string to datetime if needed"""
        if 'dateLost' in data and isinstance(data['dateLost'], str):
            if len(data['dateLost']) == 10:  # YYYY-MM-DD format
                data['dateLost'] = data['dateLost'] + 'T00:00:00Z'
        if 'isFound' not in data:
            data['isFound'] = False
        return super().to_internal_value(data)
    
    def get_sightingCount(self, obj):
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
    reporterUsername = serializers.CharField(source='reporter.username', read_only=True, allow_null=True)
    lostPetName = serializers.SerializerMethodField()
    dateSighted = serializers.DateTimeField(source='date_sighted')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    lostPet = serializers.PrimaryKeyRelatedField(source='lost_pet', queryset=LostPet.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Sighting
        fields = ['id', 'reporter', 'reporterUsername', 'lostPet', 'lostPetName', 'location', 'description', 'photo', 'dateSighted', 'latitude', 'longitude', 'createdAt', 'updatedAt']
        read_only_fields = ['reporter', 'createdAt', 'updatedAt']
        extra_kwargs = {
            'lostPet': {'required': False, 'allow_null': True},
        }
    
    def get_lostPetName(self, obj):
        return obj.lost_pet.name if obj.lost_pet else None


class MatchSerializer(serializers.ModelSerializer):
    sightingDetails = SightingSerializer(source='sighting', read_only=True)
    lostPetName = serializers.CharField(source='lost_pet.name', read_only=True)
    matchScore = serializers.FloatField(source='match_score')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Match
        fields = ['id', 'sightingDetails', 'lostPetName', 'status', 'matchScore', 'notes', 'createdAt', 'updatedAt']
        read_only_fields = ['createdAt', 'updatedAt']