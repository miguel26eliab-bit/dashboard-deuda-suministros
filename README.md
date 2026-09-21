# Portal HTML de deuda de suministros

Este sitio estático publica únicamente indicadores agregados de la última carga válida de PostgreSQL. No contiene suministros, titulares, direcciones, documentos ni credenciales.

## Actualizar datos

Desde `C:\AutomatizacionDeuda`, ejecute:

```powershell
.\Scripts\generar_dashboard_web.ps1
```

El comando actualiza `data/dashboard.json`. Después debe enviarse esa modificación al proveedor de hosting estático.

## Despliegue gratuito recomendado

GitHub Pages puede alojar esta carpeta en un repositorio público. El sitio será público; use esta alternativa solo para los indicadores agregados que la organización autorice divulgar.

1. Cree un repositorio público vacío, por ejemplo `dashboard-deuda-publico`.
2. Inicialice Git desde esta carpeta, confirme los archivos y conecte el remoto del repositorio.
3. En GitHub, active **Settings → Pages → Deploy from a branch → main / root**.

No use este portal para información que requiera autenticación, segmentación por usuario o seguridad a nivel de fila.
