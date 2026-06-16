from django.contrib import admin

from .models import Edital, LogEvento


@admin.register(Edital)
class EditalAdmin(admin.ModelAdmin):
    list_display = ["titulo", "categoria", "fonte", "area_cultural", "estado", "prazo_inscricao", "status_processamento_ia", "criado_em"]
    list_filter = ["categoria", "status_processamento_ia", "estado", "fonte"]
    search_fields = ["titulo", "descricao", "orgao_responsavel"]


@admin.register(LogEvento)
class LogEventoAdmin(admin.ModelAdmin):
    list_display = ["tipo", "mensagem_curta", "edital", "organizacao", "criado_em"]
    list_filter = ["tipo", "organizacao"]
    search_fields = ["mensagem"]
    readonly_fields = ["tipo", "mensagem", "detalhes", "edital", "organizacao", "usuario", "criado_em"]

    @admin.display(description="Mensagem")
    def mensagem_curta(self, obj):
        return obj.mensagem[:100]
