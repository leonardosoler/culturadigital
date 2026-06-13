import io

import requests
from bs4 import BeautifulSoup

from .pdf_utils import extrair_texto_pdf

_HEADERS = {"User-Agent": "CulturaDigitalBot/1.0 (+https://github.com)"}


def extrair_texto_url(url: str, timeout: int = 30) -> str:
    """Baixa o conteúdo de uma URL e extrai o texto.

    Se o conteúdo for um PDF, extrai o texto das páginas. Caso contrário,
    assume HTML e remove scripts/estilos/menus antes de extrair o texto visível.
    """
    response = requests.get(url, timeout=timeout, headers=_HEADERS)
    response.raise_for_status()

    content_type = response.headers.get("Content-Type", "")
    if "pdf" in content_type.lower() or url.lower().endswith(".pdf"):
        return extrair_texto_pdf(io.BytesIO(response.content))

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)
