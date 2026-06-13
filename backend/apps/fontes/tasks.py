import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Fonte
from .scrapers import get_scraper

logger = logging.getLogger(__name__)


@shared_task
def buscar_editais_fonte(fonte_id: int) -> str:
    """Executa o scraper de uma fonte e cria/atualiza os `Edital`s correspondentes."""
    from apps.editais.models import Edital

    try:
        fonte = Fonte.objects.get(pk=fonte_id)
    except Fonte.DoesNotExist:
        return f"Fonte {fonte_id} não encontrada."

    scraper = get_scraper(fonte.tipo)
    if scraper is None:
        fonte.ultima_execucao = timezone.now()
        fonte.ultimo_resultado = "Esta fonte não possui busca automática configurada."
        fonte.save(update_fields=["ultima_execucao", "ultimo_resultado"])
        return fonte.ultimo_resultado

    try:
        itens = scraper.buscar(fonte)
    except Exception as exc:  # noqa: BLE001 - registramos qualquer erro de scraping
        logger.exception("Erro ao buscar editais da fonte %s (%s)", fonte.nome, fonte.id)
        fonte.ultima_execucao = timezone.now()
        fonte.ultimo_resultado = f"Erro: {exc}"
        fonte.save(update_fields=["ultima_execucao", "ultimo_resultado"])
        return fonte.ultimo_resultado

    criados = 0
    atualizados = 0
    with transaction.atomic():
        for item in itens:
            identificador = item.get("identificador_externo") or item.get("url_origem")
            if not identificador:
                continue
            _, created = Edital.objects.update_or_create(
                fonte=fonte,
                identificador_externo=identificador,
                defaults={
                    "titulo": (item.get("titulo") or "Sem título")[:500],
                    "url_origem": item.get("url_origem", ""),
                    "descricao": item.get("descricao", ""),
                    "orgao_responsavel": (item.get("orgao_responsavel") or "")[:255],
                    "area_cultural": (item.get("area_cultural") or "")[:255],
                    "data_publicacao": item.get("data_publicacao"),
                    "prazo_inscricao": item.get("prazo_inscricao"),
                },
            )
            if created:
                criados += 1
            else:
                atualizados += 1

    fonte.ultima_execucao = timezone.now()
    fonte.ultimo_resultado = f"{criados} edital(is) novo(s), {atualizados} atualizado(s)."
    fonte.save(update_fields=["ultima_execucao", "ultimo_resultado"])
    return fonte.ultimo_resultado


@shared_task
def buscar_todas_fontes() -> str:
    """Dispara `buscar_editais_fonte` para todas as fontes ativas com busca automática."""
    fonte_ids = list(
        Fonte.objects.filter(ativo=True, tipo=Fonte.Tipo.MAPAS_CULTURAL).values_list("id", flat=True)
    )
    for fonte_id in fonte_ids:
        buscar_editais_fonte.delay(fonte_id)
    return f"Busca disparada para {len(fonte_ids)} fonte(s)."
