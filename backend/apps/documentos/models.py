from django.db import models

from apps.accounts.models import Organizacao
from apps.acompanhamento.models import AcompanhamentoEdital


class TipoDocumento(models.TextChoices):
    CARTA_APRESENTACAO = "carta_apresentacao", "Carta de apresentação"
    PROJETO = "projeto", "Projeto cultural"
    ORCAMENTO = "orcamento", "Orçamento"


class TemplateDocumento(models.Model):
    """Personalização opcional de geração de minutas por organização e tipo."""

    organizacao = models.ForeignKey(
        Organizacao, on_delete=models.CASCADE, related_name="templates", null=True, blank=True
    )
    tipo = models.CharField(max_length=30, choices=TipoDocumento.choices)
    nome = models.CharField(max_length=255)
    instrucoes_extra = models.TextField(
        blank=True,
        help_text="Instruções adicionais para a IA considerar ao gerar este tipo de documento",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Template de documento"
        verbose_name_plural = "Templates de documento"

    def __str__(self):
        return self.nome


class DocumentoGerado(models.Model):
    """Minuta gerada por IA para um edital acompanhado."""

    Tipo = TipoDocumento

    acompanhamento = models.ForeignKey(
        AcompanhamentoEdital, on_delete=models.CASCADE, related_name="minutas"
    )
    tipo = models.CharField(max_length=30, choices=TipoDocumento.choices)
    conteudo = models.TextField(help_text="Conteúdo em markdown")
    versao = models.PositiveIntegerField(default=1)
    gerado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-gerado_em"]
        verbose_name = "Minuta"
        verbose_name_plural = "Minutas"

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.acompanhamento} (v{self.versao})"
