from rest_framework.routers import DefaultRouter

from .views import FonteViewSet

router = DefaultRouter()
router.register("", FonteViewSet, basename="fonte")

urlpatterns = router.urls
