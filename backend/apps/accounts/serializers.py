from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Membership, Organizacao

Usuario = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "username", "email", "first_name", "last_name"]


class OrganizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizacao
        fields = ["id", "nome", "cnpj", "dados_cadastrais", "criada_em"]
        read_only_fields = ["id", "criada_em"]


class MembershipSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ["id", "usuario", "papel", "criado_em"]


class RegistroSerializer(serializers.Serializer):
    nome_organizacao = serializers.CharField(max_length=255)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso.")
        return value

    def create(self, validated_data):
        organizacao = Organizacao.objects.create(nome=validated_data["nome_organizacao"])
        usuario = Usuario.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        Membership.objects.create(
            usuario=usuario, organizacao=organizacao, papel=Membership.Papel.ADMIN
        )
        return {"usuario": usuario, "organizacao": organizacao}


class ConvidarMembroSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    papel = serializers.ChoiceField(choices=Membership.Papel.choices, default=Membership.Papel.MEMBRO)

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso.")
        return value
