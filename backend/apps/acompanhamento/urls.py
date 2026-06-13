from rest_framework.routers import DefaultRouter

from .views import AcompanhamentoViewSet, ChecklistItemViewSet

router = DefaultRouter()
router.register("acompanhamentos", AcompanhamentoViewSet, basename="acompanhamento")
router.register("checklist-itens", ChecklistItemViewSet, basename="checklist-item")

urlpatterns = router.urls
