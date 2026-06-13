from django.contrib import admin

from .models import AcompanhamentoEdital, ChecklistItem


class ChecklistItemInline(admin.TabularInline):
    model = ChecklistItem
    extra = 0


@admin.register(AcompanhamentoEdital)
class AcompanhamentoEditalAdmin(admin.ModelAdmin):
    list_display = ["organizacao", "edital", "status", "criado_em"]
    list_filter = ["status", "organizacao"]
    inlines = [ChecklistItemInline]


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ["descricao", "acompanhamento", "status", "obrigatorio"]
    list_filter = ["status", "obrigatorio"]
