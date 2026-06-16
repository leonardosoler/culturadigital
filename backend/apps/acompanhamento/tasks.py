import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from apps.accounts.models import Membership

from .models import AcompanhamentoEdital, NotificacaoPrazoEnviada

logger = logging.getLogger(__name__)

LIMIARES_DIAS = [7, 3, 1, 0]


@shared_task
def notificar_prazos() -> str:
    """Envia e-mail aos membros de cada organização quando o prazo de inscrição
    de um edital acompanhado está a 7, 3, 1 ou 0 dias, evitando duplicidade."""
    hoje = timezone.localdate()
    enviados = 0

    acompanhamentos = (
        AcompanhamentoEdital.objects.filter(aprovado=True, edital__prazo_inscricao__isnull=False)
        .exclude(status__in=[AcompanhamentoEdital.Status.CONCLUIDO, AcompanhamentoEdital.Status.DESCARTADO])
        .select_related("edital", "organizacao")
    )

    for acompanhamento in acompanhamentos:
        dias = (acompanhamento.edital.prazo_inscricao - hoje).days
        if dias not in LIMIARES_DIAS:
            continue
        if NotificacaoPrazoEnviada.objects.filter(acompanhamento=acompanhamento, dias_antes=dias).exists():
            continue

        destinatarios = list(
            Membership.objects.filter(organizacao=acompanhamento.organizacao)
            .exclude(usuario__email="")
            .values_list("usuario__email", flat=True)
            .distinct()
        )
        if not destinatarios:
            continue

        if dias == 0:
            prazo_texto = "vence hoje"
        elif dias == 1:
            prazo_texto = "vence em 1 dia"
        else:
            prazo_texto = f"vence em {dias} dias"

        edital = acompanhamento.edital
        assunto = f"[CulturaDigital] {edital.titulo} {prazo_texto}"
        link = f"{settings.FRONTEND_URL}/editais/{edital.id}"
        corpo = (
            f"O prazo de inscrição do edital \"{edital.titulo}\" {prazo_texto} "
            f"({edital.prazo_inscricao.strftime('%d/%m/%Y')}).\n\n"
            f"Acesse os detalhes em: {link}"
        )

        try:
            send_mail(assunto, corpo, settings.DEFAULT_FROM_EMAIL, destinatarios, fail_silently=False)
        except Exception:  # noqa: BLE001 - não deve interromper a verificação dos demais acompanhamentos
            logger.exception("Erro ao enviar notificação de prazo para acompanhamento %s", acompanhamento.id)
            continue

        NotificacaoPrazoEnviada.objects.create(acompanhamento=acompanhamento, dias_antes=dias)

        from apps.editais.models import LogEvento
        LogEvento.objects.create(
            tipo=LogEvento.Tipo.ACOMPANHAMENTO_CRIADO,
            mensagem=f'Notificacao de prazo enviada: "{edital.titulo[:80]}" ({prazo_texto}) para {len(destinatarios)} destinatario(s).',
            edital=edital,
            organizacao=acompanhamento.organizacao,
            detalhes={"dias_antes": dias, "destinatarios": len(destinatarios)},
        )
        enviados += 1

    return f"{enviados} notificacao(oes) de prazo enviada(s)."
