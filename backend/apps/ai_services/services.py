import json
import re

from django.conf import settings

from . import prompts
from .client import get_client


def _extrair_json(texto: str) -> dict:
    """Extrai o primeiro objeto JSON encontrado em uma string de resposta da IA."""
    match = re.search(r"\{.*\}", texto, re.DOTALL)
    if not match:
        raise ValueError("A resposta da IA não contém um JSON válido.")
    return json.loads(match.group(0))


def resumir_edital(texto: str) -> dict:
    """Envia o texto de um edital para a IA e retorna um dicionário estruturado com
    resumo, elegibilidade, documentos exigidos, prazos, valores e critérios de seleção."""
    client = get_client()
    texto_truncado = texto[:60000]
    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=4096,
        system=prompts.RESUMO_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompts.RESUMO_USER_TEMPLATE.format(texto=texto_truncado)}],
    )
    return _extrair_json(response.content[0].text)


def gerar_checklist(edital) -> list[dict]:
    """Gera a lista de itens de checklist para um edital.

    Se o edital já possui `documentos_exigidos` no `requisitos_ia`, usa essa lista
    diretamente. Caso contrário, pede à IA para sugerir os itens com base no resumo.
    """
    requisitos = edital.requisitos_ia or {}
    documentos = requisitos.get("documentos_exigidos") or []
    if documentos:
        return [{"descricao": str(d), "obrigatorio": True} for d in documentos]

    client = get_client()
    prompt = prompts.CHECKLIST_USER_TEMPLATE.format(
        resumo=edital.resumo_ia or edital.titulo,
        documentos_exigidos=documentos,
        elegibilidade=requisitos.get("elegibilidade", ""),
    )
    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    dados = _extrair_json(response.content[0].text)
    return dados.get("itens", [])


def _formatar_dados_organizacao(organizacao) -> str:
    linhas = [f"- Nome: {organizacao.nome}"]
    if organizacao.cnpj:
        linhas.append(f"- CNPJ: {organizacao.cnpj}")
    for chave, valor in (organizacao.dados_cadastrais or {}).items():
        linhas.append(f"- {chave}: {valor}")
    return "\n".join(linhas)


def gerar_minuta(tipo: str, edital, organizacao, instrucoes_extra: str = "") -> str:
    """Gera o texto (markdown) de uma minuta (carta de apresentação, projeto ou orçamento)
    com base nos dados do edital e da organização proponente."""
    if tipo not in prompts.TIPOS_MINUTA:
        raise ValueError(f"Tipo de minuta desconhecido: {tipo}")

    requisitos = edital.requisitos_ia or {}
    criterios = requisitos.get("criterios_selecao") or []
    criterios_texto = "\n".join(f"- {c}" for c in criterios) or "- Não informado"

    bloco_instrucoes = (
        f"\nInstruções adicionais definidas pela organização:\n{instrucoes_extra}\n"
        if instrucoes_extra
        else ""
    )

    client = get_client()
    prompt = prompts.MINUTA_USER_TEMPLATE.format(
        tipo_descricao=prompts.TIPOS_MINUTA[tipo],
        edital_titulo=edital.titulo,
        edital_resumo=edital.resumo_ia or "",
        elegibilidade=requisitos.get("elegibilidade", "Não informado"),
        criterios=criterios_texto,
        dados_organizacao=_formatar_dados_organizacao(organizacao),
        instrucoes_extra=bloco_instrucoes,
    )
    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
