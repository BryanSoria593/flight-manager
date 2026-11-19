# Flight Manager

Aplicación web para consultar vuelos y registrar pasajeros respetando la capacidad de cada vuelo. El frontend usa React, TypeScript y TanStack Query; el backend expone una API REST en .NET con EF Core InMemory.

## Requisitos

- .NET SDK 8 o posterior. `backend/global.json` permite seleccionar un SDK posterior si no hay uno de la línea 8 instalado. La API apunta a .NET 8 y puede arrancar con un runtime posterior mediante roll-forward.
- Node.js 22.23.4, indicado en `frontend/.nvmrc` y `frontend/package.json`.
- npm o pnpm. Se mantienen ambos lockfiles para que quien evalúe pueda usar cualquiera de los dos gestores.

## Backend

Desde `backend/`:

```sh
dotnet restore
dotnet run --project src/FlightBooking.Api
```

La API escucha en `http://localhost:5080` con el perfil local. Para compilar y ejecutar las pruebas:

```sh
dotnet build --warnaserror
dotnet test
```

Los datos viven en EF Core InMemory y se reinician al detener el proceso. Los vuelos iniciales se crean al arrancar.

## Frontend

Desde `frontend/`, elige **una** de estas opciones para instalar dependencias:

```sh
npm ci
```

o:

```sh
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install --frozen-lockfile
```

Primero inicia el backend en `http://localhost:5080`. Luego, desde `frontend/`, ejecuta uno de estos comandos para arrancar la aplicación:

```sh
npm run dev
```

o:

```sh
pnpm dev
```

Vite sirve el frontend en `http://localhost:5173` y reenvía `/api` a `http://localhost:5080`.

Los comandos para probar, compilar y revisar el código son:

| Tarea | npm | pnpm |
|---|---|---|
| Pruebas | `npm test` | `pnpm test` |
| Build | `npm run build` | `pnpm build` |
| Lint | `npm run lint` | `pnpm lint` |

## Sincronización de datos

TanStack Query vuelve a consultar los vuelos y los pasajeros del vuelo seleccionado cada 30 segundos para reflejar cambios hechos desde otras sesiones. Al terminar cualquier intento de registro, invalida la caché de vuelos y vuelve a consultar el estado del servidor, incluso si la solicitud terminó con error o timeout. El polling es una mejora de sincronización; la especificación de la prueba no lo exige.

## Configuración

- `VITE_API_BASE_URL`: prefijo opcional para la API. Vacío usa el proxy de Vite.
- `FaultInjection:LatencyMs`: demora artificial en milisegundos para peticiones de API cuando el backend corre en Development.
- `ASPNETCORE_ENVIRONMENT`: controla el entorno del backend. La inyección de fallos y el encabezado `X-Simulate-Failure` solo están habilitados en Development.
- En desarrollo, el interruptor “Simular fallo de la API” activa ese encabezado desde el frontend.

## API

- `GET /api/v1/flights`: lista vuelos y ocupación.
- `GET /api/v1/flights/{flightId}/passengers`: lista pasajeros registrados.
- `POST /api/v1/flights/{flightId}/passengers`: registra un pasajero.
- `GET /health`: estado básico del servicio.

Las solicitudes de ejemplo están en `backend/src/FlightBooking.Api/FlightBooking.Api.http`.

Los errores usan ProblemDetails, un `code` estable para el frontend y un `traceId` para correlacionar el incidente.

## Estructura

```text
backend/
  src/FlightBooking.Api/
    Domain/          reglas del dominio y resultados
    Features/        endpoints y casos de uso
    Infrastructure/  EF Core InMemory, seed y utilidades
  tests/              pruebas de dominio, API y concurrencia
frontend/
  src/app/            aplicación y configuración global
  src/features/flights/ API, hooks, esquemas y componentes de vuelos
  src/shared/         cliente HTTP y componentes reutilizables
```

Consulta [DECISIONES.md](DECISIONES.md) para los criterios de arquitectura y las limitaciones conocidas.
