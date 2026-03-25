from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Package, Client, AuthorizedPickupPerson
from .serializers import PackageSerializer, ClientSerializer, AuthorizedPickupPersonSerializer


def home(request):
    return JsonResponse({"message": "Sunrise Mailroom backend is running."})


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "sunrise-mailroom-backend",
    })


@api_view(["GET", "POST"])
def package_list(request):
    if request.method == "GET":
        packages = Package.objects.all().order_by("-received_at")
        status_filter = request.GET.get("status")
        recipient_query = request.GET.get("recipient")

        if status_filter:
            packages = packages.filter(status=status_filter)

        if recipient_query:
            packages = packages.filter(recipient_name__icontains=recipient_query)

        serializer = PackageSerializer(packages, many=True)
        return Response(serializer.data)

    serializer = PackageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "PATCH", "DELETE"])
def package_detail(request, pk):
    package = get_object_or_404(Package, pk=pk)

    if request.method == "GET":
        serializer = PackageSerializer(package)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = PackageSerializer(package, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    package.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def package_mark_notified(request, pk):
    package = get_object_or_404(Package, pk=pk)
    package.status = "notified"
    package.notified_at = timezone.now()
    package.save()

    serializer = PackageSerializer(package)
    return Response(serializer.data)


@api_view(["POST"])
def package_mark_picked_up(request, pk):
    package = get_object_or_404(Package, pk=pk)
    package.status = "picked_up"
    package.picked_up_at = timezone.now()
    package.save()

    serializer = PackageSerializer(package)
    return Response(serializer.data)

@api_view(["GET", "POST"])
def client_list(request):
    if request.method == "GET":
        clients = Client.objects.all().order_by("full_name")

        search = request.GET.get("search")
        if search:
            clients = clients.filter(full_name__icontains=search)

        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data)

    serializer = ClientSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "PATCH", "DELETE"])
def client_detail(request, pk):
    client = get_object_or_404(Client, pk=pk)

    if request.method == "GET":
        serializer = ClientSerializer(client)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    client.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def client_check_in(request, pk):
    client = get_object_or_404(Client, pk=pk)
    client.check_in()
    serializer = ClientSerializer(client)
    return Response(serializer.data)

@api_view(["POST"])
def authorized_pickup_create(request, client_pk):
    client = get_object_or_404(Client, pk=client_pk)
    data = request.data.copy()
    data["client"] = client.id

    serializer = AuthorizedPickupPersonSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
def authorized_pickup_detail(request, pk):
    authorized_pickup = get_object_or_404(AuthorizedPickupPerson, pk=pk)

    if request.method == "PATCH":
        serializer = AuthorizedPickupPersonSerializer(
            authorized_pickup,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    authorized_pickup.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)