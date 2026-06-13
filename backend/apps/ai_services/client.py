import anthropic
from django.conf import settings


def get_client() -> anthropic.Anthropic:
    """Retorna um cliente Anthropic configurado.

    Levanta RuntimeError se ANTHROPIC_API_KEY não estiver configurada,
    para que as views possam transformar isso em uma resposta de erro clara.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY não configurada. Defina essa variável no arquivo .env "
            "para habilitar os recursos de IA (resumo, checklist e minutas)."
        )
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
