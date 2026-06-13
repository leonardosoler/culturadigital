# CulturaDigital

Plataforma para **encontrar editais culturais** (fomento, leis de incentivo), **processá-los com IA**
(resumo, prazos, valores, elegibilidade, documentos exigidos) e **gerar a documentação de apoio**
(checklist de documentos e minutas de proposta).

## Stack

- **Backend**: Django + Django REST Framework + Celery (worker + beat) + PostgreSQL + Redis
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query
- **IA**: Anthropic Claude (resumo de editais, geração de checklist e minutas)
- **Infra**: Docker Compose

## Estrutura

```
culturadigital/
├── docker-compose.yml
├── .env.example
├── backend/        # Django + DRF + Celery
│   └── apps/
│       ├── accounts/        # usuários, organizações, autenticação JWT
│       ├── fontes/           # fontes de busca de editais e scrapers
│       ├── editais/          # catálogo global de editais
│       ├── acompanhamento/   # editais acompanhados por cada organização + checklist
│       ├── documentos/       # geração de minutas (IA) e export .docx
│       └── ai_services/      # integração com Anthropic Claude
└── frontend/       # React + Vite + TS
```

## Como executar

1. Copie o arquivo de variáveis de ambiente e ajuste se necessário:

   ```bash
   cp .env.example .env
   ```

2. (Opcional, mas recomendado) Configure sua chave da Anthropic no `.env` para habilitar
   resumo de editais, geração de checklist e minutas:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   Sem essa chave, o sistema funciona normalmente para cadastro/busca de editais,
   mas os botões "Processar com IA", "Gerar checklist" e "Gerar minuta" retornarão erro.

3. Suba os containers:

   ```bash
   docker compose up --build
   ```

4. Crie um superusuário (opcional, para acessar `/admin`):

   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

5. (Opcional) Carregue fontes de exemplo (instâncias reais do Mapas Culturais):

   ```bash
   docker compose exec backend python manage.py loaddata fontes_exemplo
   ```

6. Acesse:
   - Frontend: http://localhost:5173
   - API: http://localhost:8000/api
   - Admin Django: http://localhost:8000/admin

## Fluxo de uso

1. **Registre** sua organização e usuário admin na tela de login/cadastro.
2. Em **Fontes**, cadastre instâncias da plataforma [Mapas Culturais](https://docs.mapasculturais.org/)
   (ex.: `https://mapacultural.secult.ce.gov.br`) — a busca automática (Celery beat) e o botão
   "Buscar agora" trazem os editais ("oportunidades") publicados para o catálogo global.
3. Use **Cadastro manual** para adicionar editais de fontes sem API (cole a URL ou envie o PDF do edital).
4. No **Dashboard**, filtre o catálogo de editais e clique em **Acompanhar** para adicionar
   à lista da sua organização (Meus Editais).
5. Abra um edital acompanhado e clique em **Processar com IA** para gerar o resumo e os
   requisitos estruturados (prazos, valores, elegibilidade, documentos exigidos).
6. Use **Gerar checklist** para criar automaticamente a lista de documentos exigidos e
   acompanhar o status de cada item (anexando seus arquivos).
7. Em **Minutas**, gere rascunhos (carta de apresentação, projeto, orçamento) com base nos
   dados da organização e do edital, e exporte em `.docx`.

## Variáveis de ambiente

Veja `.env.example` para a lista completa. As mais importantes:

| Variável | Descrição |
|---|---|
| `DJANGO_SECRET_KEY` | Chave secreta do Django |
| `POSTGRES_*` | Configuração do banco de dados |
| `REDIS_URL` | URL do Redis (broker do Celery) |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic, usada pelos recursos de IA |
| `ANTHROPIC_MODEL` | Modelo Claude usado (padrão: `claude-sonnet-4-6`) |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas para o frontend acessar a API |
| `VITE_API_URL` | URL base da API usada pelo frontend |

## Extensibilidade de fontes

Cada `Fonte` tem um `tipo` (`mapas_cultural`, `manual`, `outro`) e um campo `config` (JSON)
com parâmetros específicos. Novos tipos de scraper podem ser adicionados em
`backend/apps/fontes/scrapers/` sem alterar o schema do banco — basta registrar o novo tipo
no `SCRAPER_REGISTRY`.

> **Nota**: instâncias públicas do Mapas Culturais às vezes ficam temporariamente
> indisponíveis ou protegidas por proteções anti-bot (ex.: Cloudflare), o que pode
> fazer a busca retornar erro (`403`/`5xx`). Isso é tratado normalmente: o erro é
> registrado em `ultimo_resultado` da `Fonte` e não interrompe o restante do sistema.
> Ajuste a `url_base` para uma instância ativa caso isso ocorra.
