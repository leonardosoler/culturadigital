from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.ai_services import services as ai_services

from .models import AcompanhamentoEdital, ChecklistItem
from .serializers import AcompanhamentoSerializer, ChecklistItemSerializer


class AcompanhamentoViewSet(viewsets.ModelViewSet):
    """Editais acompanhados pela organização do usuário autenticado ("Meus Editais")."""

    serializer_class = AcompanhamentoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "edital"]

    def get_queryset(self):
        return (
            AcompanhamentoEdital.objects.filter(organizacao=self.request.user.organizacao)
            .select_related("edital")
            .prefetch_related("checklist")
        )

    def perform_create(self, serializer):
        serializer.save(organizacao=self.request.user.organizacao)

    @action(detail=True, methods=["post"], url_path="gerar-checklist")
    def gerar_checklist(self, request, pk=None):
        acompanhamento = self.get_object()
        try:
            itens = ai_services.gerar_checklist(acompanhamento.edital)
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        criados = [
            ChecklistItem.objects.create(
                acompanhamento=acompanhamento,
                descricao=str(item.get("descricao", ""))[:500],
                obrigatorio=bool(item.get("obrigatorio", True)),
            )
            for item in itens
            if item.get("descricao")
        ]
        return Response(ChecklistItemSerializer(criados, many=True).data, status=status.HTTP_201_CREATED)


class ChecklistItemViewSet(viewsets.ModelViewSet):
    """Itens de checklist (CRUD), incluindo upload de anexos."""

    serializer_class = ChecklistItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["acompanhamento", "status"]

    def get_queryset(self):
        return ChecklistItem.objects.filter(
            acompanhamento__organizacao=self.request.user.organizacao
        ).select_related("acompanhamento")
