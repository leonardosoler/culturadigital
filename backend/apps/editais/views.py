from datetime import date

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter
from rest_framework import filters as drf_filters
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Edital
from .serializers import EditalDetailSerializer, EditalListSerializer, EditalManualSerializer
from .tasks import processar_edital_ia


class EditalFilter(FilterSet):
    prazo_apos = DateFilter(field_name="prazo_inscricao", lookup_expr="gte")
    prazo_antes = DateFilter(field_name="prazo_inscricao", lookup_expr="lte")

    class Meta:
        model = Edital
        fields = ["fonte", "area_cultural", "estado", "status_processamento_ia", "orgao_responsavel"]


class EditalViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo global de editais encontrados (somente leitura + ações de processamento)."""

    filterset_class = EditalFilter
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    search_fields = ["titulo", "descricao", "orgao_responsavel", "area_cultural"]
    ordering_fields = ["criado_em", "prazo_inscricao", "data_publicacao", "titulo"]
    ordering = ["-criado_em"]

    def get_queryset(self):
        qs = (
            Edital.objects.select_related("fonte")
            .filter(Q(fonte__isnull=True) | Q(fonte__ativo=True))
            .filter(Q(prazo_inscricao__isnull=True) | Q(prazo_inscricao__gte=date.today()))
        )
        grupo_id = self.request.query_params.get("grupo")
        if grupo_id:
            try:
                from apps.accounts.models import Grupo
                grupo = Grupo.objects.get(pk=grupo_id, organizacao=self.request.user.organizacao, ativo=True)
                if grupo.estados:
                    qs = qs.filter(estado__in=grupo.estados)
                if grupo.areas_culturais:
                    area_q = Q()
                    for area in grupo.areas_culturais:
                        area_q |= Q(area_cultural__icontains=area)
                    qs = qs.filter(area_q)
            except (Grupo.DoesNotExist, Exception):
                pass
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EditalDetailSerializer
        return EditalListSerializer

    @action(detail=True, methods=["post"], url_path="processar-ia")
    def processar_ia(self, request, pk=None):
        edital = self.get_object()
        edital.status_processamento_ia = Edital.StatusProcessamento.PENDENTE
        edital.erro_processamento = ""
        edital.save(update_fields=["status_processamento_ia", "erro_processamento"])
        processar_edital_ia.delay(edital.id)
        return Response({"detail": "Processamento por IA disparado."})


class EditalManualCreateView(generics.CreateAPIView):
    """Cadastro manual de um edital via URL e/ou upload de PDF."""

    serializer_class = EditalManualSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        edital = serializer.save(fonte=None, identificador_externo="")
        processar_edital_ia.delay(edital.id)
        output = EditalDetailSerializer(edital, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)
