from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/fontes/", include("apps.fontes.urls")),
    path("api/editais/", include("apps.editais.urls")),
    path("api/", include("apps.acompanhamento.urls")),
    path("api/", include("apps.documentos.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
