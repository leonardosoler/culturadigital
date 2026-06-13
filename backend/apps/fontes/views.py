from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Fonte
from .serializers import FonteSerializer
from .tasks import buscar_editais_fonte


class FonteViewSet(viewsets.ModelViewSet):
    queryset = Fonte.objects.all()
    serializer_class = FonteSerializer

    @action(detail=True, methods=["post"])
    def executar(self, request, pk=None):
        fonte = self.get_object()
        buscar_editais_fonte.delay(fonte.id)
        return Response({"detail": "Busca disparada. Os editais encontrados aparecerão no catálogo em breve."})
