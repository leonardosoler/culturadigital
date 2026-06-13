from rest_framework.routers import DefaultRouter

from .views import DocumentoGeradoViewSet, TemplateDocumentoViewSet

router = DefaultRouter()
router.register("minutas", DocumentoGeradoViewSet, basename="minuta")
router.register("templates-documento", TemplateDocumentoViewSet, basename="template-documento")

urlpatterns = router.urls
