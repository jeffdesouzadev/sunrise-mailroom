from rest_framework import serializers

from .models import Client, Visit


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = [
            "id",
            "visited_at",
        ]


class ClientSerializer(serializers.ModelSerializer):
    visit_count = serializers.SerializerMethodField()
    last_visit_at = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id",
            "full_name",
            "date_of_birth",
            "visit_count",
            "last_visit_at",
            "created_at",
            "updated_at",
        ]

    def get_visit_count(self, obj):
        return obj.visits.count()

    def get_last_visit_at(self, obj):
        visit = obj.visits.first()
        return visit.visited_at if visit else None


class ClientDetailSerializer(ClientSerializer):
    visits = VisitSerializer(many=True, read_only=True)

    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + [
            "visits",
        ]