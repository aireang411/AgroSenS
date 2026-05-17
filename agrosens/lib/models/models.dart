// ============================================================
// MODELOS DE DATOS PARA LA APLICACIÓN FLUTTER
// ============================================================

// ============================================================
// HELPERS DE CONVERSIÓN DE TIPOS
// ============================================================
double _toDouble(dynamic value, [double defaultValue = 0.0]) {
  if (value == null) return defaultValue;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) {
    try {
      return double.parse(value);
    } catch (e) {
      return defaultValue;
    }
  }
  if (value is num) return value.toDouble();
  return defaultValue;
}

int _toInt(dynamic value, [int defaultValue = 0]) {
  if (value == null) return defaultValue;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) {
    try {
      return int.parse(value);
    } catch (e) {
      return defaultValue;
    }
  }
  if (value is num) return value.toInt();
  return defaultValue;
}

// ============================================================
// USUARIO
// ============================================================
class Usuario {
  final int id;
  final String email;
  final String nombreCompleto;
  final String rol;

  Usuario({
    required this.id,
    required this.email,
    required this.nombreCompleto,
    required this.rol,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id_usuario'] ?? 0,
      email: json['email'] ?? '',
      nombreCompleto: json['nombre_completo'] ?? '',
      rol: json['rol'] ?? 'agricultor',
    );
  }

  Map<String, dynamic> toJson() => {
    'id_usuario': id,
    'email': email,
    'nombre_completo': nombreCompleto,
    'rol': rol,
  };
}

// ============================================================
// INVERNADERO
// ============================================================
class Invernadero {
  final int id;
  final String nombre;
  final String direccion;
  final double area;
  final double? latitud;
  final double? longitud;

  Invernadero({
    required this.id,
    required this.nombre,
    required this.direccion,
    required this.area,
    this.latitud,
    this.longitud,
  });

  factory Invernadero.fromJson(Map<String, dynamic> json) {
    return Invernadero(
      id: _toInt(json['id_invernadero']),
      nombre: json['nombre'] ?? '',
      direccion: json['direccion'] ?? '',
      area: _toDouble(json['area_m2']),
      latitud: json['ubicacion_latitud'] != null ? _toDouble(json['ubicacion_latitud']) : null,
      longitud: json['ubicacion_longitud'] != null ? _toDouble(json['ubicacion_longitud']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id_invernadero': id,
    'nombre': nombre,
    'direccion': direccion,
    'area_m2': area,
    'ubicacion_latitud': latitud,
    'ubicacion_longitud': longitud,
  };
}

// ============================================================
// LOTE
// ============================================================
class Lote {
  final int id;
  final int idInvernadero;
  final String nombre;
  final String especie;
  final String etapa;
  final DateTime? fechaSiembra;
  final DateTime? fechaCosechaEstimada;

  Lote({
    required this.id,
    required this.idInvernadero,
    required this.nombre,
    required this.especie,
    required this.etapa,
    this.fechaSiembra,
    this.fechaCosechaEstimada,
  });

  factory Lote.fromJson(Map<String, dynamic> json) {
    return Lote(
      id: _toInt(json['id_lote']),
      idInvernadero: _toInt(json['id_invernadero']),
      nombre: json['nombre_lote'] ?? '',
      especie: json['especie'] ?? '',
      etapa: json['etapa_fenologica'] ?? '',
      fechaSiembra: json['fecha_siembra'] != null ? DateTime.parse(json['fecha_siembra'].toString()) : null,
      fechaCosechaEstimada: json['fecha_cosecha_estimada'] != null ? DateTime.parse(json['fecha_cosecha_estimada'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id_lote': id,
    'id_invernadero': idInvernadero,
    'nombre_lote': nombre,
    'especie': especie,
    'etapa_fenologica': etapa,
    'fecha_siembra': fechaSiembra?.toIso8601String(),
    'fecha_cosecha_estimada': fechaCosechaEstimada?.toIso8601String(),
  };
}

// ============================================================
// SENSOR
// ============================================================
class Sensor {
  final int id;
  final int idLote;
  final String nombre;
  final String tipo;
  final String idDispositivo;

  Sensor({
    required this.id,
    required this.idLote,
    required this.nombre,
    required this.tipo,
    required this.idDispositivo,
  });

  factory Sensor.fromJson(Map<String, dynamic> json) {
    return Sensor(
      id: _toInt(json['id_sensor']),
      idLote: _toInt(json['id_lote']),
      nombre: json['nombre_sensor'] ?? '',
      tipo: json['tipo_sensor'] ?? '',
      idDispositivo: json['id_dispositivo'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id_sensor': id,
    'id_lote': idLote,
    'nombre_sensor': nombre,
    'tipo_sensor': tipo,
    'id_dispositivo': idDispositivo,
  };
}

// ============================================================
// LECTURA DE SENSOR
// ============================================================
class LecturaSensor {
  final int id;
  final int idSensor;
  final int idLote;
  final double temperatura;
  final double humedad;
  final double dpv;
  final DateTime timestamp;
  final double? presionVaporSaturacion;
  final double? presionVaporReal;

  LecturaSensor({
    required this.id,
    required this.idSensor,
    required this.idLote,
    required this.temperatura,
    required this.humedad,
    required this.dpv,
    required this.timestamp,
    this.presionVaporSaturacion,
    this.presionVaporReal,
  });

  factory LecturaSensor.fromJson(Map<String, dynamic> json) {
    return LecturaSensor(
      id: _toInt(json['id_lectura']),
      idSensor: _toInt(json['id_sensor']),
      idLote: _toInt(json['id_lote']),
      temperatura: _toDouble(json['temperatura_celsius']),
      humedad: _toDouble(json['humedad_relativa']),
      dpv: _toDouble(json['dpv_calculado']),
      timestamp: DateTime.parse(json['timestamp'].toString()),
      presionVaporSaturacion: json['presion_vapor_saturacion'] != null ? _toDouble(json['presion_vapor_saturacion']) : null,
      presionVaporReal: json['presion_vapor_real'] != null ? _toDouble(json['presion_vapor_real']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id_lectura': id,
    'id_sensor': idSensor,
    'id_lote': idLote,
    'temperatura_celsius': temperatura,
    'humedad_relativa': humedad,
    'dpv_calculado': dpv,
    'timestamp': timestamp.toIso8601String(),
    'presion_vapor_saturacion': presionVaporSaturacion,
    'presion_vapor_real': presionVaporReal,
  };

  // Determinar color del semáforo DPV
  String getSemaforoColor() {
    if (dpv < 0.8) return 'verde';    // Óptimo
    if (dpv <= 1.5) return 'amarillo'; // Advertencia
    return 'rojo';                      // Crítico
  }

  String getSemaforoTexto() {
    if (dpv < 0.8) return 'Óptimo';
    if (dpv <= 1.5) return 'Advertencia';
    return 'Crítico';
  }
}

// ============================================================
// ALERTA
// ============================================================
class Alerta {
  final int id;
  final int idLote;
  final int idUsuario;
  final String tipoRiesgo;
  final double? dpvDesencadenante;
  final String mensaje;
  final String estado;
  final DateTime fechaGeneracion;

  Alerta({
    required this.id,
    required this.idLote,
    required this.idUsuario,
    required this.tipoRiesgo,
    this.dpvDesencadenante,
    required this.mensaje,
    required this.estado,
    required this.fechaGeneracion,
  });

  factory Alerta.fromJson(Map<String, dynamic> json) {
    return Alerta(
      id: _toInt(json['id_alerta']),
      idLote: _toInt(json['id_lote']),
      idUsuario: _toInt(json['id_usuario']),
      tipoRiesgo: json['tipo_riesgo'] ?? '',
      dpvDesencadenante: json['dpv_desencadenante'] != null ? _toDouble(json['dpv_desencadenante']) : null,
      mensaje: json['mensaje_texto'] ?? '',
      estado: json['estado'] ?? 'generada',
      fechaGeneracion: DateTime.parse(json['fecha_generacion'].toString()),
    );
  }

  Map<String, dynamic> toJson() => {
    'id_alerta': id,
    'id_lote': idLote,
    'id_usuario': idUsuario,
    'tipo_riesgo': tipoRiesgo,
    'dpv_desencadenante': dpvDesencadenante,
    'mensaje_texto': mensaje,
    'estado': estado,
    'fecha_generacion': fechaGeneracion.toIso8601String(),
  };

  bool get esActiva => estado != 'resuelta';

  String getSeveridadTexto() {
    switch (tipoRiesgo) {
      case 'critico':
        return 'Crítica';
      case 'pre_critico':
        return 'Alta';
      default:
        return 'Normal';
    }
  }
}

// ============================================================
// RECOMENDACIÓN
// ============================================================
class Recomendacion {
  final int id;
  final int idAlerta;
  final int idLote;
  final String nivelSeveridad;
  final String texto;

  Recomendacion({
    required this.id,
    required this.idAlerta,
    required this.idLote,
    required this.nivelSeveridad,
    required this.texto,
  });

  factory Recomendacion.fromJson(Map<String, dynamic> json) {
    return Recomendacion(
      id: _toInt(json['id_recomendacion']),
      idAlerta: _toInt(json['id_alerta']),
      idLote: _toInt(json['id_lote']),
      nivelSeveridad: json['nivel_severidad'] ?? 'medio',
      texto: json['texto_recomendacion'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id_recomendacion': id,
    'id_alerta': idAlerta,
    'id_lote': idLote,
    'nivel_severidad': nivelSeveridad,
    'texto_recomendacion': texto,
  };
}

// ============================================================
// EVENTO OPERATIVO
// ============================================================
class EventoOperativo {
  final int id;
  final int idLote;
  final int idUsuario;
  final String tipoEvento;
  final String? descripcion;
  final DateTime timestamp;
  
  // Riego
  final double? volumenLitros;
  final int? duracionMinutos;
  final String? metodoRiego;
  
  // Fertilización
  final String? tipoInsumo;
  final double? dosisGramos;
  final String? metodoAplicacion;
  final double? concentracionPpm;
  
  // Plagas
  final String? tipoPlaga;
  final String? severidad;
  final String? accionTomada;
  final String? productoUtilizado;
  final double? dosisProducto;
  
  // Cosecha
  final double? pesoKg;
  final String? calidadVisual;
  final int? cantidadPlantas;
  final double? rendimientoEstimado;
  
  // Otros
  final String? observaciones;
  final double? temperaturaAmbientalC;
  final double? humedadRelativaPct;
  final String? registradoPorDispositivo;

  EventoOperativo({
    required this.id,
    required this.idLote,
    required this.idUsuario,
    required this.tipoEvento,
    this.descripcion,
    required this.timestamp,
    this.volumenLitros,
    this.duracionMinutos,
    this.metodoRiego,
    this.tipoInsumo,
    this.dosisGramos,
    this.metodoAplicacion,
    this.concentracionPpm,
    this.tipoPlaga,
    this.severidad,
    this.accionTomada,
    this.productoUtilizado,
    this.dosisProducto,
    this.pesoKg,
    this.calidadVisual,
    this.cantidadPlantas,
    this.rendimientoEstimado,
    this.observaciones,
    this.temperaturaAmbientalC,
    this.humedadRelativaPct,
    this.registradoPorDispositivo,
  });

  factory EventoOperativo.fromJson(Map<String, dynamic> json) {
    return EventoOperativo(
      id: _toInt(json['id_evento']),
      idLote: _toInt(json['id_lote']),
      idUsuario: _toInt(json['id_usuario']),
      tipoEvento: json['tipo_evento'] ?? '',
      descripcion: json['descripcion'],
      timestamp: DateTime.parse(json['timestamp'].toString()),
      volumenLitros: json['volumen_litros'] != null ? _toDouble(json['volumen_litros']) : null,
      duracionMinutos: json['duracion_minutos'] != null ? _toInt(json['duracion_minutos']) : null,
      metodoRiego: json['metodo_riego'],
      tipoInsumo: json['tipo_insumo'],
      dosisGramos: json['dosis_gramos'] != null ? _toDouble(json['dosis_gramos']) : null,
      metodoAplicacion: json['metodo_aplicacion'],
      concentracionPpm: json['concentracion_ppm'] != null ? _toDouble(json['concentracion_ppm']) : null,
      tipoPlaga: json['tipo_plaga'],
      severidad: json['severidad'],
      accionTomada: json['accion_tomada'],
      productoUtilizado: json['producto_utilizado'],
      dosisProducto: json['dosis_producto'] != null ? _toDouble(json['dosis_producto']) : null,
      pesoKg: json['peso_kg'] != null ? _toDouble(json['peso_kg']) : null,
      calidadVisual: json['calidad_visual'],
      cantidadPlantas: json['cantidad_plantas'] != null ? _toInt(json['cantidad_plantas']) : null,
      rendimientoEstimado: json['rendimiento_estimado'] != null ? _toDouble(json['rendimiento_estimado']) : null,
      observaciones: json['observaciones'],
      temperaturaAmbientalC: json['temperatura_ambiental_c'] != null ? _toDouble(json['temperatura_ambiental_c']) : null,
      humedadRelativaPct: json['humedad_relativa_pct'] != null ? _toDouble(json['humedad_relativa_pct']) : null,
      registradoPorDispositivo: json['registrado_por_dispositivo'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id_evento': id,
    'id_lote': idLote,
    'id_usuario': idUsuario,
    'tipo_evento': tipoEvento,
    'descripcion': descripcion,
    'timestamp': timestamp.toIso8601String(),
    'volumen_litros': volumenLitros,
    'duracion_minutos': duracionMinutos,
    'metodo_riego': metodoRiego,
    'tipo_insumo': tipoInsumo,
    'dosis_gramos': dosisGramos,
    'metodo_aplicacion': metodoAplicacion,
    'concentracion_ppm': concentracionPpm,
    'tipo_plaga': tipoPlaga,
    'severidad': severidad,
    'accion_tomada': accionTomada,
    'producto_utilizado': productoUtilizado,
    'dosis_producto': dosisProducto,
    'peso_kg': pesoKg,
    'calidad_visual': calidadVisual,
    'cantidad_plantas': cantidadPlantas,
    'rendimiento_estimado': rendimientoEstimado,
    'observaciones': observaciones,
    'temperatura_ambiental_c': temperaturaAmbientalC,
    'humedad_relativa_pct': humedadRelativaPct,
    'registrado_por_dispositivo': registradoPorDispositivo,
  };

  // Obtener etiqueta legible del tipo de evento
  String get tipoEventoLabel {
    switch (tipoEvento) {
      case 'riego':
        return 'Riego';
      case 'fertilizacion':
        return 'Fertilización';
      case 'plagas':
        return 'Plagas';
      case 'cosecha':
        return 'Cosecha';
      case 'poda':
        return 'Poda';
      case 'control_enfermedad':
        return 'Control de Enfermedad';
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return 'Otro';
    }
  }

  // Color según tipo de evento
  String get tipoEventoColor {
    switch (tipoEvento) {
      case 'riego':
        return '#2196F3'; // Azul
      case 'fertilizacion':
        return '#FF9800'; // Naranja
      case 'plagas':
        return '#F44336'; // Rojo
      case 'cosecha':
        return '#4CAF50'; // Verde
      case 'poda':
        return '#9C27B0'; // Púrpura
      case 'control_enfermedad':
        return '#E91E63'; // Rosa
      default:
        return '#757575'; // Gris
    }
  }
}
