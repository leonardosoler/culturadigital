from django.contrib.auth import get_user_model
from django.db import models

from apps.fontes.constants import ESTADOS_BRASIL
from apps.fontes.models import Fonte


class Edital(models.Model):
    """Catálogo global de editais encontrados (compartilhado entre organizações)."""

    class StatusProcessamento(models.TextChoices):
        PENDENTE = "pendente", "Pendente"
        PROCESSANDO = "processando", "Processando"
        PROCESSADO = "processado", "Processado"
        ERRO = "erro", "Erro"

    class Categoria(models.TextChoices):
        CULTURAL = "cultural", "Cultural"
        LICITACAO = "licitacao", "Licitação"
        BOLSA = "bolsa", "Bolsa / Financiamento"
        CONCURSO_PUBLICO = "concurso_publico", "Concurso Público"
        CHAMADA_PESQUISA = "chamada_pesquisa", "Chamada de Pesquisa"
        OUTROS = "outros", "Outros"

    fonte = models.ForeignKey(
        Fonte, on_delete=models.SET_NULL, related_name="editais", null=True, blank=True
    )
    identificador_externo = models.CharField(
        max_length=255, blank=True, help_text="Identificador único na fonte de origem (para evitar duplicados)"
    )

    titulo = models.CharField(max_length=500)
    url_origem = models.URLField(blank=True)
    categoria = models.CharField(
        max_length=20, choices=Categoria.choices, default=Categoria.CULTURAL, blank=True,
        help_text="Tipo/categoria do edital identificado pela IA",
    )
    orgao_responsavel = models.CharField(max_length=255, blank=True)
    area_cultural = models.CharField(max_length=255, blank=True)
    estado = models.CharField(
        max_length=2,
        blank=True,
        choices=ESTADOS_BRASIL,
        help_text="UF do edital/órgão responsável, quando identificável",
    )
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


class LogEvento(models.Model):
    """Registro de eventos do sistema: scraping, processamento IA, ações de usuário."""

    class Tipo(models.TextChoices):
        SCRAPING_OK = "scraping_ok", "Scraping executado"
        SCRAPING_ERRO = "scraping_erro", "Erro no scraping"
        IA_PROCESSADO = "ia_processado", "IA processada"
        IA_ERRO = "ia_erro", "Erro na IA"
        EDITAL_CRIADO = "edital_criado", "Edital criado"
        PRAZO_IGNORADO = "prazo_ignorado", "Edital ignorado (prazo vencido)"
        ACOMPANHAMENTO_CRIADO = "acompanhamento_criado", "Acompanhamento iniciado"

    tipo = models.CharField(max_length=30, choices=Tipo.choices)
    mensagem = models.TextField()
    detalhes = models.JSONField(default=dict, blank=True)
    edital = models.ForeignKey(Edital, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")
    organizacao = models.ForeignKey(
        "accounts.Organizacao", on_delete=models.SET_NULL, null=True, blank=True, related_name="logs"
    )
    usuario = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True, blank=True, related_name="logs"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Log de evento"
        verbose_name_plural = "Logs de eventos"

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.mensagem[:80]}"
