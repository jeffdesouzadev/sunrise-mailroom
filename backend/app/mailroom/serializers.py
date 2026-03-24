from rest_framework import serializers
from .models import Package, Client, AuthorizedPickupPerson


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = "__all__"


class AuthorizedPickupPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorizedPickupPerson
        fields = "__all__"


class ClientSerializer(serializers.ModelSerializer):
    authorized_pickups = AuthorizedPickupPersonSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = "__all__"