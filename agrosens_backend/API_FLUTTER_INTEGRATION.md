# 📡 API AgroSenS - Guía de Integración Flutter

## Configuración Base

**URL Base**: `http://localhost:3000/api/v1`  
**Ambiente**: `development`

---

## 🔐 Autenticación

### 1. Registrar Usuario

```http
POST /auth/register
Content-Type: application/json

{
  "email": "agricultor@agrosens.com",
  "password": "password123",
  "nombre_completo": "Juan Pérez",
  "rol": "agricultor",
  "telefono": "+573001234567"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "usuario": {
    "id_usuario": 1,
    "email": "agricultor@agrosens.com",
    "nombre_completo": "Juan Pérez",
    "rol": "agricultor"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "agricultor@agrosens.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "usuario": {
    "id_usuario": 1,
    "email": "agricultor@agrosens.com",
    "nombre_completo": "Juan Pérez",
    "rol": "agricultor"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Guardar el token** en `SharedPreferences` de Flutter para futuras solicitudes.

### 3. Usar Token en Solicitudes

Todas las solicitudes (excepto login/register) requieren:

```http
Authorization: Bearer <token_jwt>
```

---

## 🌾 Gestión de Invernaderos

### Crear Invernadero

```http
POST /invernaderos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Invernadero Tomate A",
  "ubicacion_latitud": 4.7110,
  "ubicacion_longitud": -74.0721,
  "direccion": "Km 5 vía Mosquera",
  "orientacion": "Este-Oeste",
  "area_m2": 500.00
}
```

**Respuesta:**
```json
{
  "success": true,
  "invernadero": {
    "id_invernadero": 1,
    "nombre": "Invernadero Tomate A",
    "ubicacion_latitud": 4.7110,
    "ubicacion_longitud": -74.0721,
    "area_m2": 500.00,
    "estado": true,
    "fecha_creacion": "2026-04-30T10:30:00Z"
  }
}
```

### Obtener Invernaderos

```http
GET /invernaderos
Authorization: Bearer <token>
```

---

## 🌱 Gestión de Lotes

### Crear Lote

```http
POST /lotes
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_invernadero": 1,
  "nombre_lote": "Lote Tomate Ensalada A",
  "especie": "Tomate",
  "etapa_fenologica": "Fructificación",
  "fecha_siembra": "2026-02-01"
}
```

**Respuesta:**
```json
{
  "success": true,
  "lote": {
    "id_lote": 1,
    "id_invernadero": 1,
    "nombre_lote": "Lote Tomate Ensalada A",
    "especie": "Tomate",
    "etapa_fenologica": "Fructificación",
    "activo": true
  }
}
```

### Obtener Lotes

```http
GET /lotes?id_invernadero=1
Authorization: Bearer <token>
```

---

## 📡 Gestión de Sensores

### Registrar Nuevo Sensor

```http
POST /sensores
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_dispositivo": "DHT22_001",
  "nombre_sensor": "Sensor Temperatura/Humedad Lote 1",
  "tipo_sensor": "dht22",
  "id_lote": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "sensor": {
    "id_sensor": 5,
    "id_dispositivo": "DHT22_001",
    "nombre_sensor": "Sensor Temperatura/Humedad Lote 1",
    "tipo_sensor": "dht22",
    "estado_activo": true,
    "fecha_creacion": "2026-04-30T10:35:00Z"
  }
}
```

### Ingresar Lectura de Sensor

```http
POST /sensores/5/lecturas
Authorization: Bearer <token>
Content-Type: application/json

{
  "temperatura_celsius": 25.5,
  "humedad_relativa": 75.2
}
```

**Respuesta:**
```json
{
  "success": true,
  "lectura": {
    "id_lectura": 1024,
    "timestamp": "2026-04-30T10:40:00Z",
    "temperatura_celsius": 25.5,
    "humedad_relativa": 75.2,
    "dpv_calculado": 0.98,
    "presion_vapor_saturacion": 3.17,
    "presion_vapor_real": 2.38
  }
}
```

### Obtener Últimas Lecturas

```http
GET /sensores/5/lecturas?horas=24&limit=50
Authorization: Bearer <token>
```

---

## 🔔 Gestión de Alertas

### Generar Alerta (Desde Backend)

```http
POST /alertas/generar
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_lote": 1,
  "tipo_riesgo": "pre_critico",
  "dpv_desencadenante": 1.25,
  "probabilidad_estrés": 75
}
```

**Respuesta:**
```json
{
  "success": true,
  "alerta": {
    "id_alerta": 42,
    "id_lote": 1,
    "tipo_riesgo": "pre_critico",
    "dpv_desencadenante": 1.25,
    "probabilidad_estrés": 75,
    "estado": "generada",
    "fecha_generacion": "2026-04-30T10:45:00Z"
  },
  "recomendacion": {
    "titulo": "⚠ Riesgo moderado de estrés hídrico",
    "texto": "Se detecta una tendencia creciente...",
    "acciones_sugeridas": [
      "Incrementar riego en 15-20%",
      "Activar sistemas de nebulización"
    ],
    "urgencia": "ALTA"
  }
}
```

### Obtener Alertas

```http
GET /alertas?id_lote=1&estado=generada&dias=7
Authorization: Bearer <token>
```

### Marcar Alerta como Vista (Registra Tiempo de Reacción)

```http
POST /alertas/42/marcar-vista
Authorization: Bearer <token>
```

---

## 📊 Obtener Métricas

### Tiempo de Reacción del Usuario

```http
GET /metrics/reaccion?dias=30
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "metricas": {
    "promedio_segundos": 180,
    "minimo_segundos": 45,
    "maximo_segundos": 600,
    "total_alertas_procesadas": 12,
    "mediana_segundos": 150
  }
}
```

### Métricas de Rendimiento (Solo Admin)

```http
GET /metrics/rendimiento?horas=24
Authorization: Bearer <token>
```

---

## 🔄 Refrescar Token

Cuando el token JWT expire (por defecto 24 horas):

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "nuevo_token_jwt",
  "refreshToken": "nuevo_refresh_token"
}
```

---

## 📱 Ejemplo de Integración Flutter

### Provider Service

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AgroSensAPIService {
  static const String BASE_URL = 'http://localhost:3000/api/v1';
  String? _token;
  
  // Registrar usuario
  Future<Map<String, dynamic>> registrar({
    required String email,
    required String password,
    required String nombreCompleto,
  }) async {
    final response = await http.post(
      Uri.parse('$BASE_URL/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'nombre_completo': nombreCompleto,
        'rol': 'agricultor',
      }),
    );
    
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      _token = data['token'];
      return data;
    } else {
      throw Exception('Error al registrar: ${response.body}');
    }
  }
  
  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$BASE_URL/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _token = data['token'];
      // Guardar token en SharedPreferences
      return data;
    } else {
      throw Exception('Login fallido');
    }
  }
  
  // Obtener sensores
  Future<List> obtenerSensores() async {
    final response = await http.get(
      Uri.parse('$BASE_URL/sensores'),
      headers: {'Authorization': 'Bearer $_token'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['sensores'];
    } else {
      throw Exception('Error al obtener sensores');
    }
  }
  
  // Ingresar lectura
  Future<Map<String, dynamic>> ingresarLectura({
    required int idSensor,
    required double temperatura,
    required double humedad,
  }) async {
    final response = await http.post(
      Uri.parse('$BASE_URL/sensores/$idSensor/lecturas'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: jsonEncode({
        'temperatura_celsius': temperatura,
        'humedad_relativa': humedad,
      }),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Error al ingresar lectura');
    }
  }
  
  // Obtener alertas
  Future<List> obtenerAlertas() async {
    final response = await http.get(
      Uri.parse('$BASE_URL/alertas'),
      headers: {'Authorization': 'Bearer $_token'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['alertas'];
    } else {
      throw Exception('Error al obtener alertas');
    }
  }
}
```

---

## ⚠️ Códigos de Error

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - No tienes permiso |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - El recurso ya existe |
| 500 | Server Error - Error del servidor |

---

## 📝 Notas Importantes

1. **Token JWT**: Válido por 24 horas (configurable en `.env`)
2. **Refresh Token**: Válido por 7 días
3. **DPV**: Calculado automáticamente desde temperatura y humedad
4. **Alertas**: Generadas automáticamente cuando la probabilidad de estrés > 80%
5. **Zona Horaria**: Todos los timestamps son en UTC

---

## 🧪 Pruebas con Postman

1. Abre Postman
2. Crea colección "AgroSenS"
3. Importa los endpoints anteriores
4. En la pestaña "Authorization" selecciona "Bearer Token"
5. Agrega el token obtenido en el login

---

## 🚀 Próximos Pasos

1. Implementar `SharedPreferences` para guardar tokens
2. Crear Provider para manejo de estado
3. Conectar widgets a la API
4. Implementar refresh automático de datos
5. Agregar notificaciones push (Firebase)

