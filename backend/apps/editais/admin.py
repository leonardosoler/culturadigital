from django.contrib import admin

from .models import Edital


@admin.register(Edital)
class EditalAdmin(admin.ModelAdmin):
    list_display = [
        "titulo",
        "fonte",
        "area_cultural",
        "prazo_inscricao",
        "status_processamento_ia",
        "criado_em",
    ]
    list_filter = ["status_processamento_ia", "area_cultural", "fonte"]
    search_fields = ["titulo", "descricao", "orgao_responsavel"]
