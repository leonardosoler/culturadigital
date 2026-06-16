from django.core.management.base import BaseCommand

from apps.editais.models import Edital
from apps.editais.tasks import _extrair_prazo_inscricao, processar_edital_ia


class Command(BaseCommand):
    help = (
        "Preenche prazo_inscricao nos editais que ainda não têm. "
        "Para editais já processados pela IA, extrai do JSON salvo em requisitos_ia sem nova chamada. "
        "Para os demais, re-dispara o processamento de IA."
    )

    def handle(self, *args, **options):
        sem_prazo = Edital.objects.filter(prazo_inscricao__isnull=True)
        total = sem_prazo.count()
        self.stdout.write(f"{total} edital(is) sem prazo_inscricao encontrado(s).")

        extraidos = 0
        redisparados = 0

        for edital in sem_prazo.iterator():
            prazos = (edital.requisitos_ia or {}).get("prazos") or []
            prazo = _extrair_prazo_inscricao(prazos)
            if prazo:
                edital.prazo_inscricao = prazo
                edital.save(update_fields=["prazo_inscricao"])
                extraidos += 1
            else:
                processar_edital_ia.delay(edital.id)
                redisparados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Concluído: {extraidos} prazo(s) extraído(s) do JSON salvo, "
                f"{redisparados} edital(is) enviado(s) para reprocessamento pela IA."
            )
        )
