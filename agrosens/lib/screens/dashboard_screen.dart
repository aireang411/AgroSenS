import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'package:fl_chart/fl_chart.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  
  List<Invernadero> _invernaderos = [];
  List<Lote> _lotes = [];
  List<Sensor> _sensores = [];
  List<LecturaSensor> _lecturas24h = [];
  List<Alerta> _alertas = [];
  List<EventoOperativo> _eventosRecientes = [];
  List<EventoOperativo> _eventosHistorial = [];
  
  Invernadero? _selectedInvernadero;
  Lote? _selectedLote;
  LecturaSensor? _ultimaLectura;
  
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      // Cargar invernaderos
      final invernaderos = await _apiService.getInvernaderos();
      if (mounted) {
        setState(() {
          _invernaderos = invernaderos;
          if (invernaderos.isNotEmpty) {
            _selectedInvernadero = invernaderos.first;
          }
        });
      }

      if (_selectedInvernadero != null) {
        await _loadLotes();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar datos: $e';
        });
      }
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadLotes() async {
    if (_selectedInvernadero == null) return;

    try {
      final lotes = await _apiService.getLotes();
      final filtered = lotes
          .where((l) => l.idInvernadero == _selectedInvernadero!.id)
          .toList();
      
      if (mounted) {
        setState(() {
          _lotes = filtered;
          if (filtered.isNotEmpty) {
            _selectedLote = filtered.first;
          } else {
            _selectedLote = null;
          }
        });
      }

      if (_selectedLote != null) {
        await _loadLoteDashboard();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar lotes: $e';
        });
      }
    }
  }

  Future<void> _loadLoteDashboard() async {
    if (_selectedLote == null) return;

    try {
      // Cargar sensores, lecturas, alertas y eventos en paralelo
      final sensorsFuture = _apiService.getSensores();
      final lecturasFuture = _apiService.getLecturasPorLote(_selectedLote!.id);
      final alertasFuture = _apiService.getAlertasPorLote(_selectedLote!.id);
      final eventosFuture = _apiService.obtenerEventosPorLote(_selectedLote!.id, limit: 100);

      final results = await Future.wait([
        sensorsFuture,
        lecturasFuture,
        alertasFuture,
        eventosFuture,
      ]);

      if (mounted) {
        setState(() {
          _sensores = (results[0] as List<Sensor>)
              .where((s) => s.idLote == _selectedLote!.id)
              .toList();
          
          final lecturas = results[1] as List<LecturaSensor>;
          lecturas.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          if (lecturas.isNotEmpty) {
            _ultimaLectura = lecturas.first;
            _lecturas24h = lecturas.take(24).toList();
          } else {
            _ultimaLectura = null;
            _lecturas24h = [];
          }
           
          _alertas = (results[2] as List<Alerta>).take(5).toList();
           
          final eventos = results[3] as List<EventoOperativo>;
          eventos.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          _eventosHistorial = eventos;
          _eventosRecientes = eventos.take(5).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar datos del lote: $e';
        });
      }
    }
  }

  Color _getDpvColor() {
    if (_ultimaLectura == null) return Colors.grey;
    
    if (_ultimaLectura!.dpv < 0.2) return const Color(0xFFE74C3C); // Rojo
    if (_ultimaLectura!.dpv < 0.4) return const Color(0xFFFF8C00); // Naranja
    if (_ultimaLectura!.dpv < 0.8) return const Color(0xFF2ECC71); // Verde
    if (_ultimaLectura!.dpv <= 1.5) return const Color(0xFFFF8C00); // Naranja
    return const Color(0xFFE74C3C); // Rojo
  }

  String _getDpvTexto() {
    if (_ultimaLectura == null) return 'Sin datos';
    
    if (_ultimaLectura!.dpv < 0.2) return 'Crítico';
    if (_ultimaLectura!.dpv < 0.4) return 'Riesgo';
    if (_ultimaLectura!.dpv < 0.8) return 'Óptimo';
    if (_ultimaLectura!.dpv <= 1.5) return 'Riesgo';
    return 'Crítico';
  }

  String _formatDateTime(DateTime dateTime) {
    final day = dateTime.day.toString().padLeft(2, '0');
    final month = dateTime.month.toString().padLeft(2, '0');
    final year = dateTime.year;
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }

  String _formatHourMinute(DateTime dateTime) {
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String _formatDayHourMinute(DateTime dateTime) {
    final day = dateTime.day.toString().padLeft(2, '0');
    final month = dateTime.month.toString().padLeft(2, '0');
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$day/$month $hour:$minute';
  }

  List<FlSpot> _buildSpotsFromReadings(double Function(LecturaSensor) selector) {
    final readings = List<LecturaSensor>.from(_lecturas24h.reversed);
    if (readings.isEmpty) return [];

    final start = readings.first.timestamp;
    return readings.map((reading) {
      final minutesFromStart = reading.timestamp.difference(start).inMinutes.toDouble();
      return FlSpot(minutesFromStart, selector(reading));
    }).toList();
  }

  List<FlSpot> _buildSpotsFromEvents(double? Function(EventoOperativo) selector) {
    final withValue = _eventosHistorial
        .where((e) => selector(e) != null)
        .toList()
        .reversed
        .toList();
    return List.generate(
      withValue.length,
      (i) => FlSpot(i.toDouble(), selector(withValue[i])!),
    );
  }

  DateTime? _getReadingsStartTime() {
    if (_lecturas24h.isEmpty) return null;
    return _lecturas24h.last.timestamp;
  }

  List<EventoOperativo> _getEventsWithValue(double? Function(EventoOperativo) selector) {
    return _eventosHistorial
        .where((e) => selector(e) != null)
        .toList()
        .reversed
        .toList();
  }

  double _getEventBottomInterval(int pointsCount) {
    if (pointsCount <= 1) return 1;
    if (pointsCount <= 6) return 1;
    return (pointsCount / 6).ceilToDouble();
  }

  String _getEventIndexLabel({
    required List<EventoOperativo> events,
    required double x,
  }) {
    final index = x.round();
    if (index < 0 || index >= events.length) return '';
    if (index.toDouble() != x) return '';
    return _formatDayHourMinute(events[index].timestamp);
  }

  Widget _buildLineChartCard({
    required String title,
    required String subtitle,
    required Color color,
    required List<FlSpot> spots,
    String Function(double value)? bottomLabelFormatter,
    double? bottomInterval,
    bool isCurved = true,
  }) {
    if (spots.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Sin datos suficientes para graficar.'),
            ],
          ),
        ),
      );
    }

    final yValues = spots.map((s) => s.y).toList();
    final minY = yValues.reduce((a, b) => a < b ? a : b);
    final maxY = yValues.reduce((a, b) => a > b ? a : b);
    final padding = (maxY - minY).abs() < 0.01 ? 1.0 : (maxY - minY) * 0.15;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 12),
            SizedBox(
              height: 180,
              child: LineChart(
                LineChartData(
                  minY: minY - padding,
                  maxY: maxY + padding,
                  gridData: FlGridData(show: true, drawVerticalLine: false),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 42,
                        interval: (maxY - minY).abs() < 0.01 ? 1 : (maxY - minY) / 4,
                        getTitlesWidget: (value, meta) => Text(
                          value.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 34,
                        interval: bottomInterval,
                        getTitlesWidget: (value, meta) {
                          if (bottomLabelFormatter != null) {
                            final label = bottomLabelFormatter(value);
                            if (label.isEmpty) return const SizedBox.shrink();
                            return Transform.rotate(
                              angle: -0.4,
                              child: Text(
                                label,
                                style: const TextStyle(fontSize: 9, color: Colors.grey),
                              ),
                            );
                          }

                          if (value == spots.first.x) {
                            return const Text('Inicio', style: TextStyle(fontSize: 10, color: Colors.grey));
                          }
                          if (value == spots.last.x) {
                            return const Text('Actual', style: TextStyle(fontSize: 10, color: Colors.grey));
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ),
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: isCurved,
                      color: color,
                      barWidth: 3,
                      dotData: FlDotData(show: spots.length <= 20),
                      belowBarData: BarAreaData(show: true, color: color.withOpacity(0.15)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<MapEntry<String, String>> _buildEventoDetails(EventoOperativo e) {
    final details = <MapEntry<String, String>>[];
    String? sanitizeText(dynamic value) {
      if (value == null) return null;
      final text = value.toString().trim();
      if (text.isEmpty || text == 'null' || text == 'undefined') return null;
      return text;
    }

    void addText(String label, dynamic value) {
      final text = sanitizeText(value);
      if (text != null) {
        details.add(MapEntry(label, text));
      }
    }

    void addNumber(String label, num? value, [String unit = '']) {
      if (value != null) {
        details.add(MapEntry(label, '${value.toString()}$unit'));
      }
    }

    addText('Descripción', e.descripcion);
    addNumber('Volumen', e.volumenLitros, ' L');
    addNumber('Duración', e.duracionMinutos, ' min');
    addText('Método de riego', e.metodoRiego);
    addText('Tipo de insumo', e.tipoInsumo);
    addNumber('Dosis', e.dosisGramos, ' g');
    addText('Método de aplicación', e.metodoAplicacion);
    addNumber('Concentración', e.concentracionPpm, ' ppm');
    addText('Tipo de plaga', e.tipoPlaga);
    addText('Severidad', e.severidad);
    addText('Acción tomada', e.accionTomada);
    addText('Producto utilizado', e.productoUtilizado);
    addNumber('Dosis de producto', e.dosisProducto, ' ml');
    addNumber('Peso cosechado', e.pesoKg, ' kg');
    addText('Calidad visual', e.calidadVisual);
    addNumber('Cantidad de plantas', e.cantidadPlantas);
    addNumber('Rendimiento estimado', e.rendimientoEstimado, ' kg');
    addText('Observaciones', e.observaciones);
    addNumber('Temp. ambiental', e.temperaturaAmbientalC, ' °C');
    addNumber('Humedad relativa', e.humedadRelativaPct, ' %');
    addText('Dispositivo', e.registradoPorDispositivo);
    return details;
  }

  String _eventInitial(String label) {
    final safe = label.trim();
    if (safe.isEmpty) return '?';
    return safe[0];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadLoteDashboard,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  // Header con semáforo DPV
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: AgroTheme.darkGreen.withOpacity(0.1),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Estado de Estrés Hídrico (DPV)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: Column(
                            children: [
                              // Semáforo circular
                              Container(
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _getDpvColor(),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _getDpvColor().withOpacity(0.5),
                                      blurRadius: 20,
                                      spreadRadius: 5,
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (_ultimaLectura != null)
                                        Text(
                                          '${_ultimaLectura!.dpv.toStringAsFixed(2)}',
                                          style: const TextStyle(
                                            fontSize: 36,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                      Text(
                                        'kPa',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.white.withOpacity(0.9),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _getDpvTexto(),
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: _getDpvColor(),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Selectores
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Invernadero',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        DropdownButton<Invernadero>(
                          isExpanded: true,
                          value: _selectedInvernadero,
                          items: _invernaderos.map((inv) {
                            return DropdownMenuItem(
                              value: inv,
                              child: Text(inv.nombre),
                            );
                          }).toList(),
                          onChanged: (inv) {
                            if (inv != null) {
                              if (mounted) {
                                setState(() {
                                  _selectedInvernadero = inv;
                                });
                              }
                              _loadLotes();
                            }
                          },
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Lote',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        DropdownButton<Lote>(
                          isExpanded: true,
                          value: _selectedLote,
                          items: _lotes.map((lote) {
                            return DropdownMenuItem(
                              value: lote,
                              child: Text(lote.nombre),
                            );
                          }).toList(),
                          onChanged: (lote) {
                            if (lote != null) {
                              if (mounted) {
                                setState(() {
                                  _selectedLote = lote;
                                });
                              }
                              _loadLoteDashboard();
                            }
                          },
                        ),
                      ],
                    ),
                  ),

                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),

                  // Datos de temperatura y humedad
                  if (_ultimaLectura != null)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.5,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildStatCard('🌡️ Temperatura', '${_ultimaLectura!.temperatura.toStringAsFixed(1)}°C', Colors.orange),
                          _buildStatCard('💧 Humedad', '${_ultimaLectura!.humedad.toStringAsFixed(1)}%', Colors.blue),
                          _buildStatCard('📊 Presión Vapor Sat.', '${(_ultimaLectura!.presionVaporSaturacion ?? 0).toStringAsFixed(2)} kPa', Colors.green),
                          _buildStatCard('📈 VP Real', '${(_ultimaLectura!.presionVaporReal ?? 0).toStringAsFixed(2)} kPa', Colors.purple),
                        ],
                      ),
                    ),

                   // Gráficas históricas de lecturas
                   if (_lecturas24h.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Histórico de Variables (últimas lecturas)',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          _buildLineChartCard(
                            title: 'Temperatura',
                            subtitle: 'Tendencia de temperatura del cultivo',
                            color: Colors.deepOrange,
                            spots: _buildSpotsFromReadings((r) => r.temperatura),
                            bottomInterval: 5,
                            bottomLabelFormatter: (value) {
                              final start = _getReadingsStartTime();
                              if (start == null || value % 5 != 0) return '';
                              final ts = start.add(Duration(minutes: value.round()));
                              return _formatHourMinute(ts);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Humedad Relativa',
                            subtitle: 'Evolución de humedad relativa',
                            color: Colors.blue,
                            spots: _buildSpotsFromReadings((r) => r.humedad),
                            bottomInterval: 5,
                            bottomLabelFormatter: (value) {
                              final start = _getReadingsStartTime();
                              if (start == null || value % 5 != 0) return '';
                              final ts = start.add(Duration(minutes: value.round()));
                              return _formatHourMinute(ts);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'DPV',
                            subtitle: 'Progreso histórico del déficit de presión de vapor',
                            color: Colors.green,
                            spots: _buildSpotsFromReadings((r) => r.dpv),
                            bottomInterval: 5,
                            bottomLabelFormatter: (value) {
                              final start = _getReadingsStartTime();
                              if (start == null || value % 5 != 0) return '';
                              final ts = start.add(Duration(minutes: value.round()));
                              return _formatHourMinute(ts);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Presión de Vapor (Saturación)',
                            subtitle: 'Comportamiento de presión de vapor de saturación',
                            color: Colors.teal,
                            spots: _buildSpotsFromReadings((r) => r.presionVaporSaturacion ?? 0),
                            bottomInterval: 5,
                            bottomLabelFormatter: (value) {
                              final start = _getReadingsStartTime();
                              if (start == null || value % 5 != 0) return '';
                              final ts = start.add(Duration(minutes: value.round()));
                              return _formatHourMinute(ts);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Presión de Vapor (Real)',
                            subtitle: 'Comportamiento de presión de vapor real',
                            color: Colors.purple,
                            spots: _buildSpotsFromReadings((r) => r.presionVaporReal ?? 0),
                            bottomInterval: 5,
                            bottomLabelFormatter: (value) {
                              final start = _getReadingsStartTime();
                              if (start == null || value % 5 != 0) return '';
                              final ts = start.add(Duration(minutes: value.round()));
                              return _formatHourMinute(ts);
                            },
                          ),
                        ],
                      ),
                    ),

                  // Sensores activos
                   if (_sensores.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Sensores Activos (${_sensores.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          ..._sensores.take(3).map((s) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Card(
                              child: ListTile(
                                leading: const Icon(Icons.sensors, color: Colors.orange),
                                title: Text(s.nombre),
                                subtitle: Text(s.tipo),
                                trailing: Chip(
                                  label: const Text('Activo', style: TextStyle(color: Colors.white, fontSize: 11)),
                                  backgroundColor: Colors.green,
                                ),
                              ),
                            ),
                          )),
                        ],
                      ),
                    ),

                  // Alertas recientes
                  if (_alertas.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Alertas Recientes (${_alertas.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          ..._alertas.map((a) => Card(
                            color: a.tipoRiesgo.toLowerCase().contains('estrés') ? Colors.red[50] : Colors.yellow[50],
                            child: ListTile(
                              leading: Icon(
                                a.tipoRiesgo.toLowerCase().contains('estrés') ? Icons.warning : Icons.info,
                                color: a.tipoRiesgo.toLowerCase().contains('estrés') ? Colors.red : Colors.orange,
                              ),
                              title: Text(a.tipoRiesgo),
                              subtitle: Text(a.mensaje, maxLines: 1, overflow: TextOverflow.ellipsis),
                            ),
                          )),
                        ],
                      ),
                    ),

                   // Gráficas históricas de variables de eventos operativos
                   if (_eventosHistorial.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Histórico de Progreso Operativo',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          _buildLineChartCard(
                            title: 'Volumen de Riego',
                            subtitle: 'Litros aplicados por evento',
                            color: Colors.lightBlue,
                            spots: _buildSpotsFromEvents((e) => e.volumenLitros),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.volumenLitros).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.volumenLitros);
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Duración de Riego',
                            subtitle: 'Minutos por evento de riego',
                            color: Colors.indigo,
                            spots: _buildSpotsFromEvents((e) => e.duracionMinutos?.toDouble()),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.duracionMinutos?.toDouble()).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.duracionMinutos?.toDouble());
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Concentración Fertilizante',
                            subtitle: 'ppm registrados en fertilización',
                            color: Colors.amber.shade700,
                            spots: _buildSpotsFromEvents((e) => e.concentracionPpm),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.concentracionPpm).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.concentracionPpm);
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Peso de Cosecha',
                            subtitle: 'kg cosechados por registro',
                            color: Colors.green,
                            spots: _buildSpotsFromEvents((e) => e.pesoKg),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.pesoKg).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.pesoKg);
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Rendimiento Estimado',
                            subtitle: 'Progresión de rendimiento del cultivo',
                            color: Colors.brown,
                            spots: _buildSpotsFromEvents((e) => e.rendimientoEstimado),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.rendimientoEstimado).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.rendimientoEstimado);
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Temperatura Ambiental (Eventos)',
                            subtitle: 'Temperatura registrada al momento del evento',
                            color: Colors.deepOrange,
                            spots: _buildSpotsFromEvents((e) => e.temperaturaAmbientalC),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.temperaturaAmbientalC).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.temperaturaAmbientalC);
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                          _buildLineChartCard(
                            title: 'Humedad Relativa (Eventos)',
                            subtitle: 'Humedad registrada al momento del evento',
                            color: Colors.cyan.shade700,
                            spots: _buildSpotsFromEvents((e) => e.humedadRelativaPct),
                            isCurved: false,
                            bottomInterval: _getEventBottomInterval(_getEventsWithValue((e) => e.humedadRelativaPct).length),
                            bottomLabelFormatter: (value) {
                              final events = _getEventsWithValue((e) => e.humedadRelativaPct);
                              return _getEventIndexLabel(events: events, x: value);
                            },
                          ),
                        ],
                      ),
                    ),

                   // Eventos recientes con todos sus datos
                   if (_eventosRecientes.isNotEmpty)
                     Padding(
                       padding: const EdgeInsets.all(16),
                       child: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                           Text('Eventos Recientes (${_eventosRecientes.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                           const SizedBox(height: 12),
                           ..._eventosRecientes.map((e) {
                            final details = _buildEventoDetails(e);
                            return Card(
                              margin: const EdgeInsets.only(bottom: 10),
                              child: ExpansionTile(
                                leading: CircleAvatar(
                                  backgroundColor: Color(int.parse(e.tipoEventoColor.replaceFirst('#', '0xff'))),
                                  child: Text(_eventInitial(e.tipoEventoLabel), style: const TextStyle(color: Colors.white, fontSize: 12)),
                                ),
                                title: Text(e.tipoEventoLabel),
                                subtitle: Text(_formatDateTime(e.timestamp)),
                                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                                expandedCrossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (details.isEmpty)
                                    const Text('Sin campos adicionales en este evento.'),
                                  ...details.map(
                                    (entry) => Padding(
                                      padding: const EdgeInsets.only(bottom: 6),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          SizedBox(
                                            width: 150,
                                            child: Text(
                                              '${entry.key}:',
                                              style: const TextStyle(fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                          Expanded(child: Text(entry.value)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                           }),
                         ],
                       ),
                     ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Card(
      elevation: 2,
      child: Container(
        constraints: const BoxConstraints(minHeight: 88),
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

