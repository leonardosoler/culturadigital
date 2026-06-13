from django.contrib import admin

from .models import Fonte


@admin.register(Fonte)
class FonteAdmin(admin.ModelAdmin):
    list_display = ["nome", "tipo", "url_base", "ativo", "ultima_execucao"]
    list_filter = ["tipo", "ativo"]
    search_fields = ["nome", "url_base"]
