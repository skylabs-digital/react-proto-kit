# Debug Renders Example

Este ejemplo está diseñado para identificar y debuggear el problema de renders infinitos en los hooks `useQuery` y `useList`.

## Problema Identificado

Los hooks `useQuery` y `useList` están causando renders infinitos debido a que `fetchData` se recrea en cada render por las dependencias del `useCallback`.

## Mejoras Implementadas

### 🔧 Inyección de Dependencias
- **Conector personalizado**: `LoggingLocalStorageConnector` que extiende `LocalStorageConnector`
- **Logging automático**: Todas las peticiones HTTP se registran automáticamente
- **Inyección directa**: El conector se pasa directamente al `ApiClientProvider`

### 📊 Monitoreo Completo
- **Contador de renders**: Cada componente muestra cuántas veces se ha renderizado
- **Contador de peticiones HTTP**: Monitor en tiempo real de todas las peticiones
- **Logs detallados**: Console logs con timestamps para renders y peticiones

## Cómo usar este ejemplo

1. **Instalar dependencias:**
   ```bash
   cd examples/debug-renders
   yarn install
   ```

2. **Ejecutar el ejemplo:**
   ```bash
   yarn dev
   ```

3. **Abrir el navegador y la consola:**
   - Ve a `http://localhost:5173`
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña Console

## Qué observar

### Comportamiento Esperado (Estable)
- **ControlComponent**: Debería renderizar 1-2 veces y mantenerse estable
- **UserById/UserList**: Deberían renderizar 2-3 veces inicialmente (loading → data) y luego estabilizarse
- **HTTP Requests**: Deberían correlacionar con los renders iniciales y luego detenerse

### Comportamiento Problemático (Bug)
- **Renders infinitos**: Los números de render siguen aumentando constantemente
- **HTTP requests infinitos**: El contador de peticiones sigue creciendo
- **Console spam**: Cientos de logs de render y peticiones en pocos segundos
- **Performance degradada**: La página se vuelve lenta/no responde

## Componentes de Debug

1. **ControlComponent**: No usa hooks de la librería, debería ser estable
2. **UserById**: Usa `userApi.useQuery()` para probar el hook individual
3. **UserList**: Usa `userApi.useList()` para probar el hook de lista
4. **RequestCounter**: Muestra el total de peticiones HTTP y las más recientes

## Factores Externos Controlados

- **External Counter**: Se incrementa solo 3 veces (cada 2 segundos) y luego se detiene
- **Selected User ID**: Cambiable manualmente con botones
- **Force Counter**: Botón para incrementar manualmente el contador

## Arquitectura Mejorada

### Inyección de Dependencias
```typescript
// Conector personalizado con logging
class LoggingLocalStorageConnector extends LocalStorageConnector {
  async get<T>(endpoint: string, params?: Record<string, any>) {
    logRequest('GET', endpoint);
    return super.get<T>(endpoint, params);
  }
  // ... otros métodos
}

// Inyección directa al provider
const customConnector = new LoggingLocalStorageConnector(config);
<ApiClientProvider connector={customConnector}>
```

### Beneficios
- **Testabilidad**: Fácil mockear el conector para tests
- **Flexibilidad**: Diferentes conectores para diferentes entornos
- **Debugging**: Logging automático sin modificar el código de producción
- **Separación de responsabilidades**: El provider no necesita saber cómo crear conectores

## Próximos Pasos

Una vez que reproduzcamos el problema, podemos:
1. Identificar exactamente qué dependencias causan la recreación de `fetchData`
2. Optimizar el `useCallback` para evitar recreaciones innecesarias
3. Verificar que la fix no rompa la funcionalidad existente
4. Aplicar la misma fix a `useList`
