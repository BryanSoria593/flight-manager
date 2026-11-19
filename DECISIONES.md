Antes de empezar, aclarar que esto no es un manual de código, sino el camino que seguí, las opciones que tuve en mente, por qué las descarté y por qué terminé decidiéndome por una solución para el frontend y backend enfocado al problema.

## Antes de empezar a escribir código
Después de haber leído el problema principal, traté de enfocar la solución lo más simple posible y enfocarme o poner más cuidado en las partes que se necesitaba. Cada vez que intentaba plantear una arquitectura me cuestionaba si realmente valdría la pena frente a la problemática, tomando en cuenta el tiempo de entrega y sobre todo la complejidad que le podría poner a una arquitectura cuando solo necesitaba cosas concretas.

## El problema
De los requerimientos solicitados, el que podía romper la lógica del negocio como tal era insertar más asientos de lo que un vuelo aceptaba, terminando con más pasajeros que asientos, incumpliendo con la integridad de los datos.

## Backend

### 1. El último asiento

Imaginemos un vuelo con un solo asiento libre y dos personas registrando al mismo tiempo. Las dos preguntan "¿hay cupo?", las dos reciben un "sí" y las dos guardan. Resultado: el vuelo queda con más pasajeros que asientos, sin que aparezca ningún error.

Estas fueron las opciones que evalué:

- **Validar y luego guardar:** es lo más intuitivo, pero entre el momento en que reviso el cupo y el momento en que guardo queda un pequeño espacio de tiempo. Por ahí se cuela la otra petición, y es justamente lo que causa el problema.
- **Que lo controle la base de datos:** en un sistema normal le dejaría esta tarea a la base de datos, con una regla que no permita pasarse de la capacidad. Pero aquí los datos viven en memoria, así que no tenía ese escenario en mis manos.
- **Cambios simultáneos:** otra opción sería comparar la versión del vuelo al guardar y reintentar si alguien lo modificó antes. Funciona, pero agrega complejidad que este alcance no necesita.
- **Un candado para toda la aplicación:** procesar un solo registro a la vez en toda la API. Así nunca se pasa de la capacidad, pero hace esperar a gente que no tiene nada que ver, por ejemplo alguien que registra en Quito–Bogotá tendría que esperar a alguien que registra en Quito–Guayaquil.
- **Un candado por vuelo (la que elegí):** cada vuelo tiene su propio candado, así que solo esperan su turno los registros que compiten por los mismos asientos. Mientras el candado está tomado se lee el vuelo, se valida el cupo y se guarda, todo de una sola vez, sin que otra petición pueda meterse en medio. Me quedé con esta porque resolvía el problema sin traer los inconvenientes de las otras: los vuelos distintos siguen funcionando en paralelo, no hay reintentos, y el primero que llega se queda con el asiento mientras el siguiente recibe un "vuelo lleno" claro.
El lock tiene un límite ya que protege una sola instancia de la API. Como los datos también viven en memoria de un solo proceso. Con una base de datos real, esa garantía pasaría a la base de datos.

### 2. ¿Cuánta arquitectura para esta solución?
Al principio intenté implementar Clean Architecture con sus proyectos domain, application, infrastructure y api, además de los repositorios, casos de uso e interfaces. Es lo que uno suele tener de referencia como proyecto estándar o un proyecto bien hecho, pero realmente la arquitectura no iba a solucionar el problema del último asiento, sino cómo se maneja el registro. Lo que sí iba a lograr segurísimo es que si quería debuguear o hacer un cambio y darle seguimiento a una acción, tendría que recorrer todos sus proyectos cuando al final el proyecto no iba a pasar de 3 o 4 endpoints.

Así que me fui por algo más directo: **Vertical Slice Architecture**, con un solo proyecto para la API y otro para las pruebas, organizado en tres carpetas.

- **Features:** dejé cada caso de uso en su propio archivo. Por ejemplo, en `RegisterPassenger.cs` está todo lo del registro: lo que recibe, la validación, el handler y el endpoint, cada uno en su clase. Así, si quiero revisar o cambiar el registro, lo encuentro en un solo lugar.

- **Domain:** las reglas del negocio se manejan aquí. Eso sí lo rescaté de Clean Architecture: el que decide si hay cupo o si el documento ya está registrado es `Flight`, no el endpoint.

- **Infrastructure:** lo técnico, como los datos, el candado por vuelo y el manejo de errores.


#### ¿Por qué Vertical Slice?

Porque organiza el código por lo que hace el sistema y no por tipo de archivo. Si mañana se solicita agregar el correo al registro, el cambio se hace en un solo lugar y no se toca nada de los otros casos de uso. Y si llega una funcionalidad nueva, se agrega como otro caso al lado, sin mover lo que ya funciona.

## Frontend

### 3. Organización por funcionalidad

En el frontend apliqué el mismo criterio que en el backend. Lo común en React es separar por tipo de archivo: una carpeta para componentes, otra para hooks y otra para servicios. Pero para revisar una sola pantalla hay que pasar por todas ellas, así que preferí organizarlo por funcionalidad:

- **features/flights:** todo lo relacionado con vuelos: pantallas, componentes, hooks, validaciones y llamadas a la API.
- **shared:** lo que se reutiliza en toda la aplicación, como el cliente HTTP, el manejo de errores y las alertas.
- **app:** la configuración general.

### 4. Cómo dividí los componentes

Traté de que los componentes solo se encarguen de mostrar y que la lógica quede en los hooks, así si cambia el diseño no tengo que tocar la lógica y al revés. También dividí la pantalla según lo que ve el usuario: la lista de vuelos, el detalle, el formulario y los pasajeros, cada uno con su propia tarea. Y no quise crear componentes genéricos por si acaso, solo dejé como reutilizable lo que realmente se usa en varios lugares, como las alertas.

### 5. ¿Por qué TanStack Query?

En este caso, lo único que necesitaba manejar dentro de la app era el vuelo seleccionado y lo que se escribe en el formulario, así que con `useState` era suficiente. Lo demás viene de la API: los vuelos, los cupos y los pasajeros. Y como otra persona también puede estar registrando, esos datos pueden cambiar.

Pensé en Redux o Zustand, pero para lo que necesitaba habría tenido que resolver por mi cuenta la carga, los errores y cuándo volver a consultar los datos. Así que me fui por TanStack Query, que ya resuelve esas partes. Después de registrar un pasajero se vuelven a consultar los vuelos, para mostrar la disponibilidad que devuelve la API.

### 6. Cómo manejo las peticiones

Para las peticiones no usé axios, preferí `fetch` con un cliente pequeño que le pone un tiempo límite a cada llamada y traduce los errores de la API a mensajes claros para el usuario. Las respuestas también las valido con zod, así si el backend cambia algo la app muestra un error controlado y no se rompe la pantalla. Las consultas se reintentan solo cuando falla la red o el servidor, pero el registro nunca se reintenta solo, porque podría terminar inscribiendo dos veces a la misma persona.


## Si esto pasara a producción

Esta solución está pensada para el alcance del ejercicio. Si tuviera que llevarla a un entorno real, estas son algunas cosas que revisaría o agregaría.

### Base de datos real y el cupo controlado desde la base

Lo primero sería dejar la memoria y pasar a una base de datos real. El candado por vuelo funciona porque hay una sola instancia de la API, pero apenas haya dos o más, cada una tendría su propio candado y se pierde la garantía. Por eso, en producción la regla de no pasarse del cupo la controlaría la base de datos, con un control de concurrencia sobre el vuelo: si dos registros intentan modificarlo al mismo tiempo, uno entra y el otro recibe el conflicto.

### Autenticación y permisos

En este momento cualquiera que llegue a la API puede registrar un pasajero. En producción agregaría autenticación con tokens y permisos por endpoint, para que solo el personal autorizado pueda registrar.

### Logs y monitoreo

En producción guardaría lo que pasa en cada petición y lo enviaría a una herramienta de monitoreo.
La idea sería enterarme antes de que lo reporte un usuario y, si él lo reporta primero, tener por dónde empezar a revisar y encontrar el problema más rápido.

### Health

Hoy la API solo dice "estoy encendida", pero eso no significa que esté bien. En producción también revisaría que llegue a la base de datos, y si no llega, que deje de recibir usuarios hasta recuperarse.

### Límite de peticiones

El registro es el endpoint más delicado, y en producción le pondría un límite de peticiones por usuario o por IP. Si alguien o algún proceso empieza a mandar registros en masa, lo bloquearía por un momento antes de que pueda afectar a los demás.

### Despliegue

Prepararía la aplicación para poder instalarla de la misma forma en cada servidor, sin tener que configurar todo a mano. También haría que, antes de subir un cambio a producción, se ejecuten las pruebas y se revise automáticamente que el código cumpla con los estándares definidos. Así podría detectar errores antes de que lleguen al usuario.

### Migrar a .NET 10

.NET 8 ya dejó de recibir actualizaciones de seguridad. Para la prueba lo mantuve porque fue la versión que me confirmaron que usarían para evaluarla. En producción sí lo migraría a .NET 10 para seguir recibiendo soporte y parches de seguridad.

### Si el sistema crece

No cambiaría de arquitectura, la haría crecer. Si mañana se agregan otros temas como reservas o pagos, cada uno tendría su propio módulo, y dentro de cada módulo seguiría la misma idea de un caso de uso por archivo. Así lo que ya funciona no se toca, y cada parte nueva se agrega al lado sin desordenar el resto.

### No reinventar lo que ya existe

Varias de las cosas que menciono aquí (usuarios, autenticación, permisos, logs, monitoreo) no son parte del negocio de registrar pasajeros, pero toman bastante tiempo hacerlas bien desde cero. Por eso, si esto pasara a producción, consideraría partir de un marco de trabajo que ya las resuelva, como fullstackhero, que es open source y está en .NET 10 y React.
