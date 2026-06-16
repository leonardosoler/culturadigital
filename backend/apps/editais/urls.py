from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import EditalManualCreateView, EditalViewSet, LogEventoListView

router = DefaultRouter()
router.register("", EditalViewSet, basename="edital")

urlpatterns = [
    path("manual/", EditalManualCreateView.as_view(), name="edital-manual"),
    path("logs/", LogEventoListView.as_view(), name="edital-logs"),
] + router.urls
