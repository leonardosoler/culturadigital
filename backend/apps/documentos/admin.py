from django.contrib import admin

from .models import DocumentoGerado, TemplateDocumento


@admin.register(DocumentoGerado)
class DocumentoGeradoAdmin(admin.ModelAdmin):
    list_display = ["acompanhamento", "tipo", "versao", "gerado_em"]
    list_filter = ["tipo"]


@admin.register(TemplateDocumento)
class TemplateDocumentoAdmin(admin.ModelAdmin):
    list_display = ["nome", "tipo", "organizacao"]
    list_filter = ["tipo"]
