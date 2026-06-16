import logging
from datetime import date
from decimal import Decimal, InvalidOperation

from celery import shared_task

from apps.ai_services import services as ai_services
from apps.ai_services.pdf_utils import extrair_texto_pdf
from apps.ai_services.web_utils import extrair_texto_url
from apps.fontes.constants import UFS_VALIDAS

from .models import Edital

logger = logging.getLogger(__name__)


def _to_decimal(valor):
    if valor is None or valor == "":
        return None
    try:
        return Decimal(str(valor))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _extrair_prazo_inscricao(prazos: list) -> date | None:
    """Escolhe a data de inscrição da lista de prazos retornada pela IA.

    Prefere entradas cuja descrição contenha 'inscri'; caso contrário usa a
    data mais próxima (menor), que tende a ser o prazo de inscrição.
    """
    candidatos = []
    for item in prazos or []:
        data_str = (item.get("data") or "")[:10]
        try:
            d = date.fromisoformat(data_str)
        except (ValueError, TypeError):
            continue
        candidatos.append((item.get("descricao", "").lower(), d))

    if not candidatos:
        return None

    for descricao, d in candidatos:
        if "inscri" in descricao:
            return d

    return min(d for _, d in candidatos)


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
        if resultado.get("estado") and not edital.estado:
            estado_ia = str(resultado["estado"]).strip().upper()
            if estado_ia in UFS_VALIDAS:
                edital.estado = estado_ia

        if not edital.prazo_inscricao:
            prazo = _extrair_prazo_inscricao(resultado.get("prazos") or [])
            if prazo:
                edital.prazo_inscricao = prazo

        categoria_ia = str(resultado.get("categoria") or "").strip().lower()
        if categoria_ia in Edital.Categoria.values:
            edital.categoria = categoria_ia

        valores = resultado.get("valores") or {}
        edital.valor_minimo = _to_decimal(valores.get("valor_minimo"))
        edital.valor_maximo = _to_decimal(valores.get("valor_maximo"))

        edital.status_processamento_ia = Edital.StatusProcessamento.PROCESSADO
        edital.save()

        from .models import LogEvento
        LogEvento.objects.create(
            tipo=LogEvento.Tipo.IA_PROCESSADO,
            mensagem=f'IA processou "{edital.titulo[:80]}".',
            edital=edital,
        )
        return "Edital processado com sucesso."
    except Exception as exc:  # noqa: BLE001
        logger.exception("Erro ao processar edital %s com IA", edital_id)
        edital.status_processamento_ia = Edital.StatusProcessamento.ERRO
        edital.erro_processamento = str(exc)
        edital.save(update_fields=["status_processamento_ia", "erro_processamento"])
        from .models import LogEvento
        LogEvento.objects.create(
            tipo=LogEvento.Tipo.IA_ERRO,
            mensagem=f'Erro ao processar IA para "{edital.titulo[:80]}": {exc}',
            edital=edital,
        )
        raise
