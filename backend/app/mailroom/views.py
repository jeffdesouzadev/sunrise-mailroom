from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Client, Visit
from .serializers import (
    ClientSerializer,
    ClientDetailSerializer,
    VisitSerializer,
)


def home(request):
    return JsonResponse({
        "message": "Sunrise Mailroom backend is running."
    })


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "sunrise-mailroom-backend",
    })


@api_view(["GET", "POST"])
def client_list(request):
    if request.method == "GET":
        clients = Client.objects.all()

        dob = request.GET.get("dob")
        name = request.GET.get("name")

        #
        # Birthday is the primary narrowing mechanism.
        #
        if dob:
            clients = clients.filter(date_of_birth=dob)

        #
        # Treat each entered name as a search token.
        #
        # Example:
        #
        #   "juan cruz"
        #
        # becomes:
        #
        #   full_name contains "juan"
        #   AND
        #   full_name contains "cruz"
        #
        if name:
            tokens = name.strip().split()

            for token in tokens:
                clients = clients.filter(
                    full_name__icontains=token
                )

        clients = clients.order_by("full_name")

        serializer = ClientSerializer(
            clients,
            many=True,
        )

        return Response(serializer.data)

    serializer = ClientSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "DELETE"])
def client_detail(request, pk):
    client = get_object_or_404(Client, pk=pk)

    if request.method == "GET":
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = ClientSerializer(
            client,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    client.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )


@api_view(["POST"])
def client_visit(request, pk):
    client = get_object_or_404(Client, pk=pk)

    visit = Visit.objects.create(
        client=client,
    )

    serializer = VisitSerializer(visit)

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED,
    )