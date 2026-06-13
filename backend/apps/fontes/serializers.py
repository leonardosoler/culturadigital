from rest_framework import serializers

from .models import Fonte


class FonteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fonte
        fields = [
            "id",
            "nome",
            "tipo",
            "url_base",
            "config",
            "ativo",
            "ultima_execucao",
            "ultimo_resultado",
            "criada_em",
        ]
        read_only_fields = ["id", "ultima_execucao", "ultimo_resultado", "criada_em"]
