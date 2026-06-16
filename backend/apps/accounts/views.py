from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Grupo, Membership
from .serializers import (
    ConvidarMembroSerializer,
    GrupoSerializer,
    MembershipSerializer,
    OrganizacaoSerializer,
    RegistroSerializer,
    UsuarioSerializer,
)

Usuario = get_user_model()


class RegistroView(APIView):
    """Cria uma nova organização e o usuário administrador inicial."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = serializer.save()
        usuario = resultado["usuario"]
        refresh = RefreshToken.for_user(usuario)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "usuario": UsuarioSerializer(usuario).data,
                "organizacao": OrganizacaoSerializer(resultado["organizacao"]).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """Dados do usuário autenticado, organização e papel."""

    def get(self, request):
        usuario = request.user
        organizacao = usuario.organizacao
        return Response(
            {
                "usuario": UsuarioSerializer(usuario).data,
                "organizacao": OrganizacaoSerializer(organizacao).data if organizacao else None,
                "papel": usuario.papel,
            }
        )


class OrganizacaoView(generics.RetrieveUpdateAPIView):
    """Dados cadastrais da organização do usuário autenticado (usados nas minutas)."""

    serializer_class = OrganizacaoSerializer

    def get_object(self):
        organizacao = self.request.user.organizacao
        if organizacao is None:
            raise NotFound("Usuário não pertence a nenhuma organização.")
        return organizacao


class GrupoViewSet(viewsets.ModelViewSet):
    """CRUD de grupos de interesse da organização + gerenciamento de membros."""

    serializer_class = GrupoSerializer

    def _exigir_admin(self):
        if self.request.user.papel != Membership.Papel.ADMIN:
            raise PermissionDenied("Apenas administradores podem gerenciar grupos.")

    def get_queryset(self):
        org = self.request.user.organizacao
        if not org:
            return Grupo.objects.none()
        return Grupo.objects.filter(organizacao=org).prefetch_related("membros")

    def perform_create(self, serializer):
        self._exigir_admin()
        serializer.save(organizacao=self.request.user.organizacao)

    def perform_update(self, serializer):
        self._exigir_admin()
        serializer.save()

    def perform_destroy(self, instance):
        self._exigir_admin()
        instance.delete()

    @action(detail=True, methods=["post"], url_path="membros")
    def adicionar_membro(self, request, pk=None):
        grupo = self.get_object()
        self._exigir_admin()
        usuario_id = request.data.get("usuario_id")
        if not usuario_id:
            return Response({"detail": "usuario_id é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        org = request.user.organizacao
        if not Membership.objects.filter(usuario_id=usuario_id, organizacao=org).exists():
            return Response({"detail": "Usuário não pertence à organização."}, status=status.HTTP_400_BAD_REQUEST)
        grupo.membros.add(usuario_id)
        return Response(GrupoSerializer(grupo).data)

    @action(detail=True, methods=["delete"], url_path=r"membros/(?P<usuario_id>[^/.]+)")
    def remover_membro(self, request, pk=None, usuario_id=None):
        grupo = self.get_object()
        self._exigir_admin()
        grupo.membros.remove(usuario_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MembrosView(generics.ListCreateAPIView):
    """Lista e convida membros para a organização do usuário autenticado."""

    serializer_class = MembershipSerializer

    def get_queryset(self):
        organizacao = self.request.user.organizacao
        return Membership.objects.filter(organizacao=organizacao).select_related("usuario")

    def create(self, request, *args, **kwargs):
        serializer = ConvidarMembroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        usuario = Usuario.objects.create_user(
            username=data["username"], email=data["email"], password=data["password"]
        )
        membership = Membership.objects.create(
            usuario=usuario, organizacao=request.user.organizacao, papel=data["papel"]
        )
        return Response(MembershipSerializer(membership).data, status=status.HTTP_201_CREATED)
