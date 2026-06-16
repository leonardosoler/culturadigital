RESUMO_SYSTEM_PROMPT = """Você é um assistente especializado em análise de editais culturais \
brasileiros (leis de incentivo, fomento, prêmios, chamadas públicas). Leia o texto do edital \
fornecido e retorne SOMENTE um objeto JSON válido, sem nenhum texto adicional antes ou depois, \
sem markdown e sem comentários."""

RESUMO_USER_TEMPLATE = """Analise o edital abaixo e retorne um JSON com exatamente esta estrutura \
(use null ou listas vazias quando a informação não estiver disponível):

{{
  "resumo": "resumo objetivo do edital em até 8 linhas",
  "categoria": "uma das opções: cultural | licitacao | bolsa | concurso_publico | chamada_pesquisa | outros",
  "orgao_responsavel": "nome do órgão/instituição responsável",
  "area_cultural": "área cultural principal (ex: música, audiovisual, artes visuais, literatura, multidisciplinar)",
  "estado": "sigla (UF) de 2 letras do estado do órgão responsável ou de abrangência do edital, ou null se for nacional/não identificável (ex: RJ, SP, CE)",
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

OPORTUNIDADES_SYSTEM_PROMPT = """Você é um assistente que monitora sites de instituições culturais \
brasileiras em busca de editais, chamadas públicas, prêmios e oportunidades de fomento. Leia o \
conteúdo fornecido (texto de uma página ou de itens de um feed) e retorne SOMENTE um objeto JSON \
válido, sem nenhum texto adicional antes ou depois, sem markdown e sem comentários."""

OPORTUNIDADES_USER_TEMPLATE = """Analise o conteúdo abaixo, extraído da página "{url_base}" ({nome_fonte}), \
e identifique editais, chamadas públicas ou oportunidades culturais (abertas ou recentes). Ignore menus, \
rodapés, links de navegação e notícias que não sejam editais/chamadas/oportunidades de fomento ou premiação. \
Ignore também oportunidades claramente encerradas há muito tempo (ex: anos anteriores).

Retorne um JSON com exatamente esta estrutura:
{{
  "oportunidades": [
    {{
      "titulo": "título do edital/chamada/oportunidade",
      "url": "URL absoluta para a página com mais detalhes (ou a própria URL da página analisada, se não houver link específico)",
      "descricao": "breve descrição em até 3 linhas",
      "data_publicacao": "AAAA-MM-DD ou null se não identificável",
      "prazo_inscricao": "AAAA-MM-DD ou null se não identificável"
    }}
  ]
}}

Se não encontrar nenhuma oportunidade relevante, retorne {{"oportunidades": []}}.

Conteúdo:
---
{conteudo}
---
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
{instrucoes_extra}{bloco_orcamento}
Gere apenas o conteúdo do documento em markdown, sem comentários adicionais antes ou depois.
"""

ORCAMENTO_ITENS_TEMPLATE = """
Planilha orçamentária informada pela organização (use estes valores como base e apresente-os \
em uma tabela markdown com colunas Categoria, Descrição, Quantidade, Valor unitário e Valor total, \
seguida do valor total geral):
{itens}
"""
