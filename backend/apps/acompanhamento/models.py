from django.db import models

from apps.accounts.models import Organizacao
from apps.editais.models import Edital


class AcompanhamentoEdital(models.Model):
    """Edital adicionado à lista de uma organização ("Meus Editais")."""

    class Status(models.TextChoices):
        NOVO = "novo", "Novo"
        EM_ANALISE = "em_analise", "Em análise"
        ELEGIVEL = "elegivel", "Elegível"
        INSCRITO = "inscrito", "Inscrito"
        CONCLUIDO = "concluido", "Concluído"
        DESCARTADO = "descartado", "Descartado"

    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="acompanhamentos")
    edital = models.ForeignKey(Edital, on_delete=models.CASCADE, related_name="acompanhamentos")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOVO)
    notas = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("organizacao", "edital")
        ordering = ["-criado_em"]
        verbose_name = "Acompanhamento"
        verbose_name_plural = "Acompanhamentos"

    def __str__(self):
        return f"{self.organizacao} - {self.edital}"


class ChecklistItem(models.Model):
    """Item de checklist (documento/providência) de um acompanhamento."""

    class Status(models.TextChoices):
        PENDENTE = "pendente", "Pendente"
        ANEXADO = "anexado", "Anexado"
        OK = "ok", "OK"

    acompanhamento = models.ForeignKey(
        AcompanhamentoEdital, on_delete=models.CASCADE, related_name="checklist"
    )
    descricao = models.CharField(max_length=500)
    obrigatorio = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDENTE)
    arquivo_anexo = models.FileField(upload_to="checklist/", null=True, blank=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "Item de checklist"
        verbose_name_plural = "Itens de checklist"

    def __str__(self):
        return self.descricao
