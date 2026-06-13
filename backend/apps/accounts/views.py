from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Membership
from .serializers import (
    ConvidarMembroSerializer,
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
