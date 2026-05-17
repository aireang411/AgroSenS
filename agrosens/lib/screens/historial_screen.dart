import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'package:fl_chart/fl_chart.dart';

class HistorialScreen extends StatefulWidget {
  const HistorialScreen({Key? key}) : super(key: key);

  @override
  State<HistorialScreen> createState() => _HistorialScreenState();
}

class _HistorialScreenState extends State<HistorialScreen> {
  final ApiService _apiService = ApiService();
  
  List<Lote> _lotes = [];
  List<LecturaSensor> _lecturas = [];
  Lote? _selectedLote;
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
      final lotes = await _apiService.getLotes();
      if (mounted) {
        setState(() {
          _lotes = lotes;
          if (lotes.isNotEmpty) {
            _selectedLote = lotes.first;
          }
        });
      }

      if (_selectedLote != null) {
        await _loadLecturasHistoricas();
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

  Future<void> _loadLecturasHistoricas() async {
    if (_selectedLote == null) return;

    try {
      final lecturas = await _apiService.getLecturasPorLote(_selectedLote!.id);
      // Ordenar de más antigua a más reciente
      lecturas.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      if (mounted) {
        setState(() {
          _lecturas = lecturas;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar lecturas: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                color: AgroTheme.darkGreen.withOpacity(0.1),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Historial de Datos',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_lecturas.length} registros',
                      style: const TextStyle(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: DropdownButton<Lote>(
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
                      setState(() {
                        _selectedLote = lote;
                      });
                      _loadLecturasHistoricas();
                    }
                  },
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

              // Gráficos
              if (_lecturas.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Temperatura (°C)',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 200,
                        child: LineChart(
                          LineChartData(
                            gridData: FlGridData(show: true),
                            titlesData: FlTitlesData(
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    if (value.toInt() % (_lecturas.length ~/ 5) == 0) {
                                      final idx = value.toInt();
                                      if (idx < _lecturas.length) {
                                        return Text(
                                          _lecturas[idx].timestamp.hour.toString().padLeft(2, '0'),
                                          style: const TextStyle(fontSize: 10),
                                        );
                                      }
                                    }
                                    return const Text('');
                                  },
                                ),
                              ),
                            ),
                            borderData: FlBorderData(show: true),
                            lineBarsData: [
                              LineChartBarData(
                                spots: List.generate(
                                  _lecturas.length,
                                  (index) => FlSpot(
                                    index.toDouble(),
                                    _lecturas[index].temperatura,
                                  ),
                                ),
                                isCurved: true,
                                color: Colors.orange,
                                barWidth: 2,
                                dotData: FlDotData(show: false),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Humedad (%)',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 200,
                        child: LineChart(
                          LineChartData(
                            gridData: FlGridData(show: true),
                            titlesData: FlTitlesData(
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    if (value.toInt() % (_lecturas.length ~/ 5) == 0) {
                                      final idx = value.toInt();
                                      if (idx < _lecturas.length) {
                                        return Text(
                                          _lecturas[idx].timestamp.hour.toString().padLeft(2, '0'),
                                          style: const TextStyle(fontSize: 10),
                                        );
                                      }
                                    }
                                    return const Text('');
                                  },
                                ),
                              ),
                            ),
                            borderData: FlBorderData(show: true),
                            lineBarsData: [
                              LineChartBarData(
                                spots: List.generate(
                                  _lecturas.length,
                                  (index) => FlSpot(
                                    index.toDouble(),
                                    _lecturas[index].humedad,
                                  ),
                                ),
                                isCurved: true,
                                color: Colors.blue,
                                barWidth: 2,
                                dotData: FlDotData(show: false),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'DPV - Déficit Presión Vapor (kPa)',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 200,
                        child: LineChart(
                          LineChartData(
                            gridData: FlGridData(show: true),
                            titlesData: FlTitlesData(
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    if (value.toInt() % (_lecturas.length ~/ 5) == 0) {
                                      final idx = value.toInt();
                                      if (idx < _lecturas.length) {
                                        return Text(
                                          _lecturas[idx].timestamp.hour.toString().padLeft(2, '0'),
                                          style: const TextStyle(fontSize: 10),
                                        );
                                      }
                                    }
                                    return const Text('');
                                  },
                                ),
                              ),
                            ),
                            borderData: FlBorderData(show: true),
                            lineBarsData: [
                              LineChartBarData(
                                spots: List.generate(
                                  _lecturas.length,
                                  (index) => FlSpot(
                                    index.toDouble(),
                                    _lecturas[index].dpv,
                                  ),
                                ),
                                isCurved: true,
                                color: AgroTheme.darkGreen,
                                barWidth: 2,
                                dotData: FlDotData(show: false),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Tabla de datos
              if (_lecturas.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Lecturas Detalladas',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columns: const [
                            DataColumn(label: Text('Hora')),
                            DataColumn(label: Text('Temp °C')),
                            DataColumn(label: Text('Hum %')),
                            DataColumn(label: Text('DPV kPa')),
                          ],
                          rows: List.generate(
                            _lecturas.length > 20 ? 20 : _lecturas.length,
                            (index) {
                              final lectura = _lecturas[_lecturas.length - 1 - index];
                              return DataRow(
                                cells: [
                                  DataCell(Text(
                                    lectura.timestamp.toString().substring(11, 16),
                                  )),
                                  DataCell(Text(
                                    '${lectura.temperatura.toStringAsFixed(1)}',
                                  )),
                                  DataCell(Text(
                                    '${lectura.humedad.toStringAsFixed(1)}',
                                  )),
                                  DataCell(Text(
                                    '${lectura.dpv.toStringAsFixed(2)}',
                                  )),
                                ],
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton.icon(
                  onPressed: _loadData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Actualizar'),
                ),
              ),
            ],
          ),
        ),
    );
  }
}
