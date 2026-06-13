from rest_framework import serializers

from apps.editais.serializers import EditalListSerializer

from .models import AcompanhamentoEdital, ChecklistItem


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = [
            "id",
            "acompanhamento",
            "descricao",
            "obrigatorio",
            "status",
            "arquivo_anexo",
            "observacoes",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]


class AcompanhamentoSerializer(serializers.ModelSerializer):
    edital_detalhe = EditalListSerializer(source="edital", read_only=True)
    checklist = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = AcompanhamentoEdital
        fields = [
            "id",
            "organizacao",
            "edital",
            "edital_detalhe",
            "status",
            "notas",
            "checklist",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "organizacao", "criado_em", "atualizado_em"]
