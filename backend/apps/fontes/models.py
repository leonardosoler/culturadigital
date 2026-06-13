from django.db import models


class Fonte(models.Model):
    """Uma fonte de busca de editais (instância de plataforma, ou fonte de referência)."""

    class Tipo(models.TextChoices):
        MAPAS_CULTURAL = "mapas_cultural", "Mapas Culturais (instância)"
        MANUAL = "manual", "Cadastro manual"
        OUTRO = "outro", "Outra fonte (sem busca automática)"

    nome = models.CharField(max_length=255)
    tipo = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.MAPAS_CULTURAL)
    url_base = models.URLField(
        blank=True,
        help_text="URL base da instância (ex: https://mapacultural.secult.ce.gov.br)",
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Parâmetros específicos do scraper, ex: {\"limite\": 30}",
    )
    ativo = models.BooleanField(default=True)
    ultima_execucao = models.DateTimeField(null=True, blank=True)
    ultimo_resultado = models.TextField(
        blank=True,
        help_text="Resumo da última execução (quantidade encontrada, erros, etc.)",
    )
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Fonte"
        verbose_name_plural = "Fontes"
        ordering = ["nome"]

    def __str__(self):
        return self.nome
