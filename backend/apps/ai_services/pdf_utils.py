import pdfplumber


def extrair_texto_pdf(arquivo, max_paginas: int = 60) -> str:
    """Extrai o texto de um arquivo PDF (objeto file-like ou caminho).

    Limita a quantidade de páginas lidas para evitar custos/latência
    excessivos ao enviar o texto para a IA.
    """
    paginas_texto = []
    with pdfplumber.open(arquivo) as pdf:
        for indice, pagina in enumerate(pdf.pages):
            if indice >= max_paginas:
                break
            paginas_texto.append(pagina.extract_text() or "")
    return "\n".join(paginas_texto).strip()
