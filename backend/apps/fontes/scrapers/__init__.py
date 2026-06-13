from .base import BaseScraper
from .mapas_cultural import MapasCulturaisScraper

SCRAPER_REGISTRY: dict[str, BaseScraper] = {
    "mapas_cultural": MapasCulturaisScraper(),
}


def get_scraper(tipo: str) -> BaseScraper | None:
    """Retorna a instância do scraper para o tipo de fonte, ou None se o tipo
    não possuir busca automática (ex.: 'manual', 'outro')."""
    return SCRAPER_REGISTRY.get(tipo)


__all__ = ["BaseScraper", "MapasCulturaisScraper", "SCRAPER_REGISTRY", "get_scraper"]
