from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """Usuário customizado (permite estender campos no futuro)."""

    @property
    def organizacao(self):
        membership = self.memberships.select_related("organizacao").first()
        return membership.organizacao if membership else None

    @property
    def papel(self):
        membership = self.memberships.first()
        return membership.papel if membership else None


class Organizacao(models.Model):
    """Organização/equipe que acompanha editais e gera documentação."""

    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=20, blank=True)
    dados_cadastrais = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dados usados para preencher minutas: responsável legal, endereço, área de atuação, etc.",
    )
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Organização"
        verbose_name_plural = "Organizações"

    def __str__(self):
        return self.nome


class Grupo(models.Model):
    """Grupo de usuários dentro de uma organização com filtros de interesse para o catálogo."""

    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="grupos")
    nome = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    membros = models.ManyToManyField("Usuario", related_name="grupos", blank=True)
    estados = models.JSONField(default=list, blank=True, help_text="UFs de interesse (lista vazia = todos os estados)")
    areas_culturais = models.JSONField(default=list, blank=True, help_text="Áreas culturais de interesse (lista vazia = todas)")
    categorias = models.JSONField(default=list, blank=True, help_text="Categorias de edital de interesse (lista vazia = todas)")
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]
        verbose_name = "Grupo"
        verbose_name_plural = "Grupos"

    def __str__(self):
        return f"{self.nome} ({self.organizacao})"


class Membership(models.Model):
    """Vínculo entre um usuário e uma organização."""

    class Papel(models.TextChoices):
        ADMIN = "admin", "Administrador"
        MEMBRO = "membro", "Membro"

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="memberships")
    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="memberships")
    papel = models.CharField(max_length=10, choices=Papel.choices, default=Papel.MEMBRO)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("usuario", "organizacao")
        verbose_name = "Vínculo"
        verbose_name_plural = "Vínculos"

    def __str__(self):
        return f"{self.usuario} @ {self.organizacao} ({self.get_papel_display()})"
