from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("grupos", views.GrupoViewSet, basename="grupo")

urlpatterns = [
    path("registro/", views.RegistroView.as_view(), name="registro"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login-refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("organizacao/", views.OrganizacaoView.as_view(), name="organizacao"),
    path("membros/", views.MembrosView.as_view(), name="membros"),
    path("", include(router.urls)),
]
