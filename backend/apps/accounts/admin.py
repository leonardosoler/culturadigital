from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Membership, Organizacao, Usuario

admin.site.register(Usuario, UserAdmin)


@admin.register(Organizacao)
class OrganizacaoAdmin(admin.ModelAdmin):
    list_display = ["nome", "cnpj", "criada_em"]
    search_fields = ["nome", "cnpj"]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ["usuario", "organizacao", "papel", "criado_em"]
    list_filter = ["papel"]
