import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme.dart';

class AlertasScreen extends StatefulWidget {
  const AlertasScreen({Key? key}) : super(key: key);

  @override
  State<AlertasScreen> createState() => _AlertasScreenState();
}

class _AlertasScreenState extends State<AlertasScreen> {
  final ApiService _apiService = ApiService();

  List<Invernadero> _invernaderos = [];
  List<Lote> _lotes = [];
  List<Alerta> _alertas = [];
  List<Recomendacion> _recomendaciones = [];
  Invernadero? _selectedInvernadero;
  Lote? _selectedLote;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final invernaderos = await _apiService.getInvernaderos();
      final lotes = await _apiService.getLotes();

      if (!mounted) return;

      _invernaderos = invernaderos;
      _selectedInvernadero = invernaderos.isNotEmpty ? invernaderos.first : null;

      _lotes = _selectedInvernadero == null
          ? []
          : lotes.where((l) => l.idInvernadero == _selectedInvernadero!.id).toList();
      _selectedLote = _lotes.isNotEmpty ? _lotes.first : null;

      if (_selectedLote != null) {
        await _loadAlertasPorCultivo();
      } else {
        setState(() {
          _alertas = [];
          _recomendaciones = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar datos: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadAlertasPorCultivo() async {
    if (_selectedLote == null) return;

    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final response = await _apiService.getAlertasInteligentesPorCultivo(_selectedLote!.id);
      final alertasJson = (response['alertas'] as List<dynamic>? ?? []);
      final recomendacionesJson = (response['recomendaciones'] as List<dynamic>? ?? []);

      final alertas = alertasJson
          .map((json) => Alerta.fromJson(Map<String, dynamic>.from(json as Map)))
          .toList();

      final recomendaciones = recomendacionesJson
          .map((json) => Recomendacion.fromJson(Map<String, dynamic>.from(json as Map)))
          .toList();

      if (mounted) {
        setState(() {
          _alertas = alertas;
          _recomendaciones = recomendaciones;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar alertas del cultivo: $e';
          _isLoading = false;
        });
      }
    }
  }

  Color _getSeveridadColor(String tipoRiesgo) {
    switch (tipoRiesgo) {
      case 'critico':
        return const Color(0xFFE74C3C);
      case 'pre_critico':
        return const Color(0xFFFF8C00);
      default:
        return const Color(0xFF27AE60);
    }
  }

  String _getNivelTexto(String tipoRiesgo) {
    switch (tipoRiesgo) {
      case 'critico':
        return 'Alta';
      case 'pre_critico':
        return 'Media';
      default:
        return 'Baja';
    }
  }

  String _detectVariable(String mensaje) {
    final upper = mensaje.toUpperCase();
    if (upper.contains('[DPV]') || upper.contains('DPV')) return 'DPV';
    if (upper.contains('[HUMEDAD]') || upper.contains('HUMEDAD')) return 'Humedad';
    if (upper.contains('[TEMPERATURA]') || upper.contains('TEMPERATURA')) return 'Temperatura';
    return 'General';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadAlertasPorCultivo,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                color: AgroTheme.darkGreen.withOpacity(0.1),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Alertas y Recomendaciones del Cultivo',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_alertas.where((a) => a.esActiva).length} alertas activas en el cultivo seleccionado',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Invernadero', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    DropdownButton<Invernadero>(
                      isExpanded: true,
                      value: _selectedInvernadero,
                      items: _invernaderos.map((inv) => DropdownMenuItem(value: inv, child: Text(inv.nombre))).toList(),
                      onChanged: (inv) {
                        if (inv == null) return;
                        final allLotesFuture = _apiService.getLotes();
                        allLotesFuture.then((allLotes) {
                          if (!mounted) return;
                          final lotesFiltrados = allLotes.where((l) => l.idInvernadero == inv.id).toList();
                          setState(() {
                            _selectedInvernadero = inv;
                            _lotes = lotesFiltrados;
                            _selectedLote = lotesFiltrados.isNotEmpty ? lotesFiltrados.first : null;
                          });
                          _loadAlertasPorCultivo();
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    const Text('Cultivo / Lote', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    DropdownButton<Lote>(
                      isExpanded: true,
                      value: _selectedLote,
                      items: _lotes.map((lote) => DropdownMenuItem(value: lote, child: Text('${lote.nombre} (${lote.especie})'))).toList(),
                      onChanged: (lote) {
                        if (lote == null) return;
                        setState(() {
                          _selectedLote = lote;
                        });
                        _loadAlertasPorCultivo();
                      },
                    ),
                  ],
                ),
              ),
              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: CircularProgressIndicator(),
                ),
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                ),
              if (!_isLoading && _errorMessage == null && _alertas.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(Icons.check_circle, size: 64, color: Colors.green.withOpacity(0.6)),
                      const SizedBox(height: 10),
                      const Text('Todo en rango por ahora', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('No hay variables fuera de valores estándar para este cultivo.', textAlign: TextAlign.center),
                    ],
                  ),
                ),
              if (!_isLoading && _alertas.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: _alertas.map((alerta) {
                      final color = _getSeveridadColor(alerta.tipoRiesgo);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: color.withOpacity(0.2),
                            child: Icon(Icons.warning_amber_rounded, color: color),
                          ),
                          title: Text(alerta.mensaje, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 6),
                              Text('Variable: ${_detectVariable(alerta.mensaje)}'),
                              Text('Nivel: ${_getNivelTexto(alerta.tipoRiesgo)}', style: TextStyle(color: color)),
                              if (alerta.dpvDesencadenante != null)
                                Text('DPV asociado: ${alerta.dpvDesencadenante!.toStringAsFixed(2)} kPa'),
                              Text('Fecha: ${alerta.fechaGeneracion.toString().substring(0, 16)}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                            ],
                          ),
                          isThreeLine: true,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              if (!_isLoading && _recomendaciones.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Recomendaciones sugeridas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      ..._recomendaciones.map(
                        (rec) => Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AgroTheme.darkGreen.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border(left: BorderSide(color: AgroTheme.darkGreen, width: 4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Severidad: ${rec.nivelSeveridad}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              Text(rec.texto),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: ElevatedButton.icon(
                  onPressed: _loadAlertasPorCultivo,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Actualizar alertas del cultivo'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
