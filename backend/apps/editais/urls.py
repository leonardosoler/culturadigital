from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import EditalManualCreateView, EditalViewSet

router = DefaultRouter()
router.register("", EditalViewSet, basename="edital")

# A rota "manual/" precisa vir antes das rotas do router, caso contrário o
# DefaultRouter tentaria interpretar "manual" como um pk.
urlpatterns = [
    path("manual/", EditalManualCreateView.as_view(), name="edital-manual"),
] + router.urls
