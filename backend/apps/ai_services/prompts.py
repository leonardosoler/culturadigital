RESUMO_SYSTEM_PROMPT = """Você é um assistente especializado em análise de editais culturais \
brasileiros (leis de incentivo, fomento, prêmios, chamadas públicas). Leia o texto do edital \
fornecido e retorne SOMENTE um objeto JSON válido, sem nenhum texto adicional antes ou depois, \
sem markdown e sem comentários."""

RESUMO_USER_TEMPLATE = """Analise o edital abaixo e retorne um JSON com exatamente esta estrutura \
(use null ou listas vazias quando a informação não estiver disponível):

{{
  "resumo": "resumo objetivo do edital em até 8 linhas",
  "orgao_responsavel": "nome do órgão/instituição responsável",
  "area_cultural": "área cultural principal (ex: música, audiovisual, artes visuais, literatura, multidisciplinar)",
  "elegibilidade": "quem pode participar (pessoa física, MEI, CNPJ cultural, coletivos, etc.)",
  "documentos_exigidos": ["lista de documentos exigidos para inscrição"],
  "prazos": [{{"descricao": "descrição do prazo", "data": "AAAA-MM-DD ou texto livre se não houver data exata"}}],
  "valores": {{"valor_minimo": null, "valor_maximo": null, "descricao": "descrição dos valores/categorias de premiação"}},
  "criterios_selecao": ["lista de critérios de avaliação/seleção"]
}}

Texto do edital:
---
{texto}
---
"""

CHECKLIST_USER_TEMPLATE = """Com base nas informações do edital abaixo, gere uma lista de itens de \
checklist (documentos e providências necessárias para a inscrição). Retorne SOMENTE um JSON no formato:

{{
  "itens": [
    {{"descricao": "descrição do item", "obrigatorio": true}}
  ]
}}

Resumo do edital: {resumo}
Documentos exigidos conhecidos: {documentos_exigidos}
Elegibilidade: {elegibilidade}
"""

TIPOS_MINUTA = {
    "carta_apresentacao": "carta de apresentação do projeto cultural",
    "projeto": "descrição/projeto cultural completo (proposta)",
    "orcamento": "planilha orçamentária descritiva do projeto",
}

MINUTA_USER_TEMPLATE = """Você é um assistente que ajuda organizações culturais a redigir documentos \
para inscrição em editais. Gere o texto de uma {tipo_descricao} para o edital abaixo, em português, \
em formato markdown, pronto para ser revisado e adaptado pela organização proponente.

Dados do edital:
- Título: {edital_titulo}
- Resumo: {edital_resumo}
- Elegibilidade: {elegibilidade}
- Critérios de seleção:
{criterios}

Dados da organização proponente:
{dados_organizacao}
{instrucoes_extra}
Gere apenas o conteúdo do documento em markdown, sem comentários adicionais antes ou depois.
"""
