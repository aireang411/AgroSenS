import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api/v1';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  /// Extrae lista de datos de respuesta JSON
  /// Maneja: [datos], {data: [...]}, {success: true, data: [...]}
  List<dynamic> _extractListFromResponse(dynamic jsonResponse) {
    if (jsonResponse is List) {
      return jsonResponse;
    } else if (jsonResponse is Map) {
      // Buscar propiedad 'data'
      if (jsonResponse['data'] != null) {
        final data = jsonResponse['data'];
        if (data is List) return data;
      }
      // Si no hay 'data', buscar la primera propiedad que sea una lista
      for (final value in jsonResponse.values) {
        if (value is List) return value;
      }
    }
    throw Exception('Formato de respuesta no válido: $jsonResponse');
  }

  // ============= AUTENTICACIÓN =============

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception('Error de login: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<Map<String, dynamic>?> register(
    String email,
    String password,
    String fullName,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'nombre_completo': fullName,
        }),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      throw Exception('Error de registro: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // ============= INVERNADEROS =============

  Future<List<Invernadero>> getInvernaderos() async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/invernaderos'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Invernadero.fromJson(json)).toList();
      }
      throw Exception('Error al obtener invernaderos: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // ============= LOTES =============

  Future<List<Lote>> getLotes() async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/lotes'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Lote.fromJson(json)).toList();
      }
      throw Exception('Error al obtener lotes: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<List<Lote>> getLotesPorInvernadero(int idInvernadero) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/lotes?invernadero_id=$idInvernadero'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Lote.fromJson(json)).toList();
      }
      throw Exception('Error: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // ============= SENSORES =============

  Future<List<Sensor>> getSensores() async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/sensores'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Sensor.fromJson(json)).toList();
      }
      throw Exception('Error al obtener sensores: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<LecturaSensor> simularLecturaDesdeEvento({
    required int loteId,
    required String tipoEvento,
    double? temperaturaAmbientalC,
    double? humedadRelativaPct,
    double? volumenLitros,
    int? duracionMinutos,
    double? concentracionPpm,
    double? dosisGramos,
    String? severidad,
    double? rendimientoEstimado,
  }) async {
    try {
      final token = await _getToken();
      final body = <String, dynamic>{
        'id_lote': loteId,
        'tipo_evento': tipoEvento,
      };

      if (temperaturaAmbientalC != null) body['temperatura_ambiental_c'] = temperaturaAmbientalC;
      if (humedadRelativaPct != null) body['humedad_relativa_pct'] = humedadRelativaPct;
      if (volumenLitros != null) body['volumen_litros'] = volumenLitros;
      if (duracionMinutos != null) body['duracion_minutos'] = duracionMinutos;
      if (concentracionPpm != null) body['concentracion_ppm'] = concentracionPpm;
      if (dosisGramos != null) body['dosis_gramos'] = dosisGramos;
      if (severidad != null) body['severidad'] = severidad;
      if (rendimientoEstimado != null) body['rendimiento_estimado'] = rendimientoEstimado;

      final response = await http.post(
        Uri.parse('$baseUrl/sensores/simulacion/evento'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        final lecturaJson = jsonResponse['lectura'] ?? jsonResponse['data'];
        return LecturaSensor.fromJson(lecturaJson);
      }
      throw Exception('Error al simular lectura: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // ============= LECTURAS DE SENSORES =============

  Future<List<LecturaSensor>> getLecturasPorLote(int loteId) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/lotes/$loteId/lecturas'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => LecturaSensor.fromJson(json)).toList();
      }
      throw Exception('Error al obtener lecturas: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<LecturaSensor?> getUltimaLecturaPorLote(int loteId) async {
    try {
      final lecturas = await getLecturasPorLote(loteId);
      if (lecturas.isEmpty) return null;
      // Retornar la última lectura
      lecturas.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return lecturas.first;
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  // ============= ALERTAS =============

  Future<List<Alerta>> getAlertas() async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/alertas'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Alerta.fromJson(json)).toList();
      }
      throw Exception('Error al obtener alertas: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<List<Alerta>> getAlertasPorLote(int loteId) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/alertas?lote_id=$loteId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Alerta.fromJson(json)).toList();
      }
      throw Exception('Error: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<Map<String, dynamic>> getAlertasInteligentesPorCultivo(int loteId) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/alertas/cultivo/$loteId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return jsonResponse as Map<String, dynamic>;
      }
      throw Exception('Error al obtener alertas por cultivo: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // ============= RECOMENDACIONES =============

  Future<List<Recomendacion>> getRecomendaciones() async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/recomendaciones'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Recomendacion.fromJson(json)).toList();
      }
      throw Exception('Error al obtener recomendaciones: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  Future<List<Recomendacion>> getRecomendacionesPorAlerta(int alertaId) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/recomendaciones?alerta_id=$alertaId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => Recomendacion.fromJson(json)).toList();
      }
      throw Exception('Error: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // ============= EVENTOS OPERATIVOS =============

  /// Registra un nuevo evento operativo
  Future<EventoOperativo> registrarEvento({
    required int loteId,
    required String tipoEvento,
    String? descripcion,
    double? volumenLitros,
    int? duracionMinutos,
    String? metodoRiego,
    String? tipoInsumo,
    double? dosisGramos,
    String? metodoAplicacion,
    double? concentracionPpm,
    String? tipoPlaga,
    String? severidad,
    String? accionTomada,
    String? productoUtilizado,
    double? dosisProducto,
    double? pesoKg,
    String? calidadVisual,
    int? cantidadPlantas,
    double? rendimientoEstimado,
    String? observaciones,
    double? temperaturaAmbientalC,
    double? humedadRelativaPct,
    String? registradoPorDispositivo,
  }) async {
    try {
      final token = await _getToken();
      
      // Construir body dinámicamente
      final body = {
        'id_lote': loteId,
        'tipo_evento': tipoEvento,
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      // Agregar campos opcionales solo si tienen valor
      if (descripcion != null) body['descripcion'] = descripcion;
      if (volumenLitros != null) body['volumen_litros'] = volumenLitros;
      if (duracionMinutos != null) body['duracion_minutos'] = duracionMinutos;
      if (metodoRiego != null) body['metodo_riego'] = metodoRiego;
      if (tipoInsumo != null) body['tipo_insumo'] = tipoInsumo;
      if (dosisGramos != null) body['dosis_gramos'] = dosisGramos;
      if (metodoAplicacion != null) body['metodo_aplicacion'] = metodoAplicacion;
      if (concentracionPpm != null) body['concentracion_ppm'] = concentracionPpm;
      if (tipoPlaga != null) body['tipo_plaga'] = tipoPlaga;
      if (severidad != null) body['severidad'] = severidad;
      if (accionTomada != null) body['accion_tomada'] = accionTomada;
      if (productoUtilizado != null) body['producto_utilizado'] = productoUtilizado;
      if (dosisProducto != null) body['dosis_producto'] = dosisProducto;
      if (pesoKg != null) body['peso_kg'] = pesoKg;
      if (calidadVisual != null) body['calidad_visual'] = calidadVisual;
      if (cantidadPlantas != null) body['cantidad_plantas'] = cantidadPlantas;
      if (rendimientoEstimado != null) body['rendimiento_estimado'] = rendimientoEstimado;
      if (observaciones != null) body['observaciones'] = observaciones;
      if (temperaturaAmbientalC != null) body['temperatura_ambiental_c'] = temperaturaAmbientalC;
      if (humedadRelativaPct != null) body['humedad_relativa_pct'] = humedadRelativaPct;
      if (registradoPorDispositivo != null) body['registrado_por_dispositivo'] = registradoPorDispositivo;
      
      final response = await http.post(
        Uri.parse('$baseUrl/eventos'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 201) {
        final jsonData = jsonDecode(response.body);
        return EventoOperativo.fromJson(jsonData['data'] ?? jsonData);
      }
      String backendError = '';
      try {
        final errorJson = jsonDecode(response.body);
        backendError = (errorJson['error'] ?? errorJson['message'] ?? '').toString();
      } catch (_) {}

      throw Exception(
        backendError.isNotEmpty
            ? 'Error al registrar evento (${response.statusCode}): $backendError'
            : 'Error al registrar evento: ${response.statusCode}',
      );
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Obtiene eventos operativos de un lote
  Future<List<EventoOperativo>> obtenerEventosPorLote(
    int loteId, {
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/eventos/lotes/$loteId?limit=$limit&offset=$offset'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = _extractListFromResponse(jsonResponse);
        return data.map((json) => EventoOperativo.fromJson(json)).toList();
      }
      throw Exception('Error al obtener eventos: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Obtiene un evento operativo específico
  Future<EventoOperativo> obtenerEvento(int eventoId) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/eventos/$eventoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        return EventoOperativo.fromJson(jsonData['data'] ?? jsonData);
      }
      throw Exception('Error al obtener evento: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Actualiza un evento operativo
  Future<EventoOperativo> actualizarEvento(
    int eventoId,
    Map<String, dynamic> updates,
  ) async {
    try {
      final token = await _getToken();
      final response = await http.put(
        Uri.parse('$baseUrl/eventos/$eventoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(updates),
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        return EventoOperativo.fromJson(jsonData['data'] ?? jsonData);
      }
      throw Exception('Error al actualizar evento: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Elimina un evento operativo
  Future<bool> eliminarEvento(int eventoId) async {
    try {
      final token = await _getToken();
      final response = await http.delete(
        Uri.parse('$baseUrl/eventos/$eventoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      }
      throw Exception('Error al eliminar evento: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }
}
