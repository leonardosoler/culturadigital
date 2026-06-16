from rest_framework import serializers

from .models import Edital, LogEvento


class EditalListSerializer(serializers.ModelSerializer):
    fonte_nome = serializers.CharField(source="fonte.nome", read_only=True, default=None)
    score_relevancia = serializers.SerializerMethodField()

    class Meta:
        model = Edital
        fields = [
            "id",
            "titulo",
            "categoria",
            "fonte",
            "fonte_nome",
            "url_origem",
            "orgao_responsavel",
            "area_cultural",
            "estado",
            "data_publicacao",
            "prazo_inscricao",
            "valor_minimo",
            "valor_maximo",
            "status_processamento_ia",
            "score_relevancia",
            "criado_em",
        ]

    def get_score_relevancia(self, obj):
        return getattr(obj, "score_relevancia", None)


class EditalDetailSerializer(serializers.ModelSerializer):
    fonte_nome = serializers.CharField(source="fonte.nome", read_only=True, default=None)

    class Meta:
        model = Edital
        fields = [
            "id",
            "titulo",
            "categoria",
            "fonte",
            "fonte_nome",
            "identificador_externo",
            "url_origem",
            "orgao_responsavel",
            "area_cultural",
            "estado",
            "descricao",
            "data_publicacao",
            "prazo_inscricao",
            "valor_minimo",
            "valor_maximo",
            "arquivo_pdf",
            "texto_extraido",
            "status_processamento_ia",
            "resumo_ia",
            "requisitos_ia",
            "erro_processamento",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = fields


class EditalManualSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edital
        fields = [
            "id",
            "titulo",
            "categoria",
            "url_origem",
            "descricao",
            "arquivo_pdf",
            "area_cultural",
            "orgao_responsavel",
            "estado",
            "prazo_inscricao",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if not attrs.get("url_origem") and not attrs.get("arquivo_pdf") and not attrs.get("descricao"):
            raise serializers.ValidationError(
                "Informe ao menos a URL de origem, um arquivo PDF ou uma descrição do edital."
            )
        return attrs


class LogEventoSerializer(serializers.ModelSerializer):
    edital_titulo = serializers.CharField(source="edital.titulo", read_only=True, default=None)

    class Meta:
        model = LogEvento
        fields = ["id", "tipo", "mensagem", "detalhes", "edital", "edital_titulo", "organizacao", "criado_em"]
