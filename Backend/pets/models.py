from django.db import models
from django.conf import settings

PET_TYPES = [
    ('dog', 'Dog'),
    ('cat', 'Cat'),
    ('other', 'Other'),
]

class Pet(models.Model):
    """User's owned pet"""
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_pets')
    name = models.CharField(max_length=255)
    pet_type = models.CharField(max_length=50, choices=PET_TYPES)
    description = models.TextField()
    photo = models.ImageField(upload_to='', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_pet_type_display()})"


class LostPet(models.Model):
    """Report of a lost pet"""
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='lost_pets')
    pet = models.ForeignKey(Pet, on_delete=models.SET_NULL, null=True, blank=True, related_name='lost_reports')
    name = models.CharField(max_length=255)
    pet_type = models.CharField(max_length=50, choices=PET_TYPES)
    description = models.TextField()
    location_lost = models.CharField(max_length=255) 
    date_lost = models.DateTimeField()
    is_found = models.BooleanField(default=False)
    latitude = models.FloatField(null=True, blank=True, help_text="Latitude of where pet was lost")
    longitude = models.FloatField(null=True, blank=True, help_text="Longitude of where pet was lost")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_pet_type_display()}) - Lost"


class Sighting(models.Model):
    """Report of a sighting of a lost pet"""
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sightings', null=True, blank=True)
    lost_pet = models.ForeignKey(LostPet, on_delete=models.CASCADE, related_name='sightings', null=True, blank=True)
    location = models.CharField(max_length=255)
    description = models.TextField()
    photo = models.ImageField(upload_to='sighting_photos/', null=True, blank=True)
    date_sighted = models.DateTimeField()
    latitude = models.FloatField(null=True, blank=True, help_text="Latitude of sighting location")
    longitude = models.FloatField(null=True, blank=True, help_text="Longitude of sighting location")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        pet_name = self.lost_pet.name if self.lost_pet else "Unknown pet"
        reporter_name = self.reporter.username if self.reporter else "Anonymous"
        return f"Sighting of {pet_name} by {reporter_name}"


class Match(models.Model):
    MATCH_STATUS = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
        ('false_alarm', 'False Alarm'),
    ]
    
    sighting = models.ForeignKey(Sighting, on_delete=models.CASCADE, related_name='matches')
    lost_pet = models.ForeignKey(LostPet, on_delete=models.CASCADE, related_name='matches')
    status = models.CharField(max_length=50, choices=MATCH_STATUS, default='pending')
    match_score = models.FloatField(default=0.5, help_text="Confidence score 0-1")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-match_score', '-created_at']

    def __str__(self):
        return f"Match: {self.lost_pet.name} - {self.get_status_display()}"
