from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Package
from .serializers import PackageSerializer


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
        serializer = PackageSerializer(packages, many=True)
        return Response(serializer.data)

    serializer = PackageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)