class BaseScraper:
    """Interface base para scrapers de fontes de editais.

    Cada scraper recebe uma instância de `Fonte` e retorna uma lista de
    dicionários normalizados, prontos para serem persistidos como `Edital`:

    {
        "identificador_externo": str,   # identificador único na fonte de origem
        "titulo": str,
        "url_origem": str,
        "descricao": str,
        "orgao_responsavel": str,
        "area_cultural": str,
        "data_publicacao": date | None,
        "prazo_inscricao": date | None,
    }
    """

    def buscar(self, fonte) -> list[dict]:
        raise NotImplementedError
