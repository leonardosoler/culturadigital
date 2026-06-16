from django.core.management.base import BaseCommand

from apps.editais.models import Edital
from apps.editais.tasks import processar_edital_ia


class Command(BaseCommand):
    help = (
        "Preenche o campo categoria nos editais que ainda não têm. "
        "Aproveita requisitos_ia já salvos quando disponível; caso contrário re-dispara a IA."
    )

    def handle(self, *args, **options):
        # Editais processados sem categoria no JSON (prompt antigo não retornava categoria)
        sem_categoria = Edital.objects.filter(categoria=Edital.Categoria.CULTURAL)
        total = sem_categoria.count()
        self.stdout.write(f"{total} edital(is) com categoria padrão (cultural) encontrado(s).")

        extraidos = 0
        redisparados = 0

        for edital in sem_categoria.iterator():
            categoria_ia = str((edital.requisitos_ia or {}).get("categoria") or "").strip().lower()
            if categoria_ia and categoria_ia in Edital.Categoria.values and categoria_ia != Edital.Categoria.CULTURAL:
                edital.categoria = categoria_ia
                edital.save(update_fields=["categoria"])
                extraidos += 1
            else:
                processar_edital_ia.delay(edital.id)
                redisparados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Concluido: {extraidos} categoria(s) extraida(s) do JSON salvo, "
                f"{redisparados} edital(is) enviado(s) para reprocessamento pela IA."
            )
        )
