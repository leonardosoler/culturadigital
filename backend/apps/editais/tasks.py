import logging
from decimal import Decimal, InvalidOperation

from celery import shared_task

from apps.ai_services import services as ai_services
from apps.ai_services.pdf_utils import extrair_texto_pdf
from apps.ai_services.web_utils import extrair_texto_url

from .models import Edital

logger = logging.getLogger(__name__)


def _to_decimal(valor):
    if valor is None or valor == "":
        return None
    try:
        return Decimal(str(valor))
    except (InvalidOperation, ValueError, TypeError):
        return None


@shared_task
def processar_edital_ia(edital_id: int) -> str:
    """Extrai o texto do edital (PDF ou URL) e usa a IA para gerar resumo e requisitos."""
    edital = Edital.objects.get(pk=edital_id)
    edital.status_processamento_ia = Edital.StatusProcessamento.PROCESSANDO
    edital.erro_processamento = ""
    edital.save(update_fields=["status_processamento_ia", "erro_processamento"])

    try:
        texto = edital.texto_extraido
        if not texto:
            if edital.arquivo_pdf:
                with edital.arquivo_pdf.open("rb") as arquivo:
                    texto = extrair_texto_pdf(arquivo)
            elif edital.url_origem:
                texto = extrair_texto_url(edital.url_origem)
            edital.texto_extraido = texto or ""

        texto_para_ia = texto or edital.descricao or edital.titulo
        resultado = ai_services.resumir_edital(texto_para_ia)

        edital.resumo_ia = resultado.get("resumo", "")
        edital.requisitos_ia = resultado

        if resultado.get("orgao_responsavel") and not edital.orgao_responsavel:
            edital.orgao_responsavel = str(resultado["orgao_responsavel"])[:255]
        if resultado.get("area_cultural") and not edital.area_cultural:
            edital.area_cultural = str(resultado["area_cultural"])[:255]

        valores = resultado.get("valores") or {}
        edital.valor_minimo = _to_decimal(valores.get("valor_minimo"))
        edital.valor_maximo = _to_decimal(valores.get("valor_maximo"))

        edital.status_processamento_ia = Edital.StatusProcessamento.PROCESSADO
        edital.save()
        return "Edital processado com sucesso."
    except Exception as exc:  # noqa: BLE001
        logger.exception("Erro ao processar edital %s com IA", edital_id)
        edital.status_processamento_ia = Edital.StatusProcessamento.ERRO
        edital.erro_processamento = str(exc)
        edital.save(update_fields=["status_processamento_ia", "erro_processamento"])
        raise
