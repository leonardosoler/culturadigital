from datetime import datetime

import requests

from .base import BaseScraper


class MapasCulturaisScraper(BaseScraper):
    """Busca oportunidades (editais) publicadas em uma instância da plataforma
    Mapas Culturais (https://docs.mapasculturais.org/).

    Dezenas de estados, capitais e municípios brasileiros publicam seus editais
    culturais usando essa plataforma (cada um em sua própria URL/instância), por
    isso este scraper genérico cobre uma parcela enorme dos editais culturais do
    Brasil — basta cadastrar a `url_base` da instância desejada.
    """

    SELECT_FIELDS = [
        "id",
        "name",
        "shortDescription",
        "registrationFrom",
        "registrationTo",
        "publishedRegistrationFrom",
    ]

    def buscar(self, fonte) -> list[dict]:
        url_base = fonte.url_base.rstrip("/")
        if not url_base:
            raise ValueError("Fonte do tipo 'mapas_cultural' precisa de uma url_base configurada.")

        limite = fonte.config.get("limite", 30)
        params = {
            "@select": ",".join(self.SELECT_FIELDS),
            "status": "GTE(1)",
            "@order": "registrationFrom DESC",
            "limit": limite,
        }

        response = requests.get(f"{url_base}/api/opportunity/find", params=params, timeout=30)
        response.raise_for_status()
        dados = response.json()
        if not isinstance(dados, list):
            raise ValueError("Resposta inesperada da API do Mapas Culturais (esperava uma lista).")

        editais = []
        for item in dados:
            opportunity_id = item.get("id")
            if opportunity_id is None:
                continue
            editais.append(
                {
                    "identificador_externo": f"mapas-{opportunity_id}",
                    "titulo": (item.get("name") or "Oportunidade sem título").strip(),
                    "url_origem": f"{url_base}/oportunidade/{opportunity_id}",
                    "descricao": (item.get("shortDescription") or "").strip(),
                    "orgao_responsavel": fonte.nome,
                    "area_cultural": "",
                    "data_publicacao": self._parse_data(item.get("publishedRegistrationFrom")),
                    "prazo_inscricao": self._parse_data(item.get("registrationTo")),
                }
            )
        return editais

    @staticmethod
    def _parse_data(valor):
        if not valor:
            return None
        try:
            return datetime.fromisoformat(str(valor).replace("Z", "+00:00")).date()
        except (ValueError, TypeError):
            return None
