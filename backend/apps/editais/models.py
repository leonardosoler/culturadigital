from django.db import models

from apps.fontes.models import Fonte


class Edital(models.Model):
    """Catálogo global de editais encontrados (compartilhado entre organizações)."""

    class StatusProcessamento(models.TextChoices):
        PENDENTE = "pendente", "Pendente"
        PROCESSANDO = "processando", "Processando"
        PROCESSADO = "processado", "Processado"
        ERRO = "erro", "Erro"

    fonte = models.ForeignKey(
        Fonte, on_delete=models.SET_NULL, related_name="editais", null=True, blank=True
    )
    identificador_externo = models.CharField(
        max_length=255, blank=True, help_text="Identificador único na fonte de origem (para evitar duplicados)"
    )

    titulo = models.CharField(max_length=500)
    url_origem = models.URLField(blank=True)
    orgao_responsavel = models.CharField(max_length=255, blank=True)
    area_cultural = models.CharField(max_length=255, blank=True)
    descricao = models.TextField(blank=True)

    data_publicacao = models.DateField(null=True, blank=True)
    prazo_inscricao = models.DateField(null=True, blank=True)

    valor_minimo = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    valor_maximo = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    arquivo_pdf = models.FileField(upload_to="editais/", null=True, blank=True)
    texto_extraido = models.TextField(blank=True)

    status_processamento_ia = models.CharField(
        max_length=20, choices=StatusProcessamento.choices, default=StatusProcessamento.PENDENTE
    )
    resumo_ia = models.TextField(blank=True)
    requisitos_ia = models.JSONField(
        default=dict,
        blank=True,
        help_text="Saída estruturada da IA: elegibilidade, documentos exigidos, prazos, valores, critérios",
    )
    erro_processamento = models.TextField(blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("fonte", "identificador_externo")
        ordering = ["-criado_em"]
        verbose_name = "Edital"
        verbose_name_plural = "Editais"

    def __str__(self):
        return self.titulo
