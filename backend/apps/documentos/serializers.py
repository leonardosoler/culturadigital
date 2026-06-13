from rest_framework import serializers

from .models import DocumentoGerado, TemplateDocumento


class DocumentoGeradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoGerado
        fields = ["id", "acompanhamento", "tipo", "conteudo", "versao", "gerado_em"]
        read_only_fields = ["id", "versao", "gerado_em"]


class GerarMinutaSerializer(serializers.Serializer):
    acompanhamento = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=DocumentoGerado.Tipo.choices)


class TemplateDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateDocumento
        fields = ["id", "organizacao", "tipo", "nome", "instrucoes_extra", "criado_em"]
        read_only_fields = ["id", "criado_em"]
