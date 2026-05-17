import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme.dart';

class RegistroScreen extends StatefulWidget {
  const RegistroScreen({Key? key}) : super(key: key);

  @override
  State<RegistroScreen> createState() => _RegistroScreenState();
}

class _RegistroScreenState extends State<RegistroScreen> {
  final ApiService _apiService = ApiService();
  
  final _descriptionController = TextEditingController();
  final _temperaturaAmbientalController = TextEditingController();
  final _humedadAmbientalController = TextEditingController();

  final _volumenLitrosController = TextEditingController();
  final _duracionMinController = TextEditingController();
  final _metodoRiegoController = TextEditingController();

  final _tipoInsumoController = TextEditingController();
  final _dosisGramosController = TextEditingController();
  final _metodoAplicacionController = TextEditingController();
  final _concentracionPpmController = TextEditingController();

  final _tipoPlagaController = TextEditingController();
  final _accionTomadaController = TextEditingController();
  final _productoUtilizadoController = TextEditingController();
  final _dosisProductoController = TextEditingController();

  final _pesoKgController = TextEditingController();
  final _cantidadPlantasController = TextEditingController();
  final _rendimientoEstimadoController = TextEditingController();

  final _observacionesController = TextEditingController();
  final _dispositivoController = TextEditingController();

  String? _severidadPlaga;
  String? _calidadVisualCosecha;
  List<Lote> _lotes = [];
  Lote? _selectedLote;
  String? _selectedEventType;
  bool _isLoading = false;
  String? _successMessage;
  String? _errorMessage;

  final List<String> _eventTypes = [
    'riego',
    'fertilizacion',
    'plagas',
    'cosecha',
    'poda',
    'control_enfermedad',
    'mantenimiento',
    'otro',
  ];

  @override
  void initState() {
    super.initState();
    _loadLotes();
  }

  Future<void> _loadLotes() async {
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
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar lotes: $e';
        });
      }
    }
  }

  Future<void> _registrarEvento() async {
    if (_selectedLote == null || 
        _selectedEventType == null) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Por favor selecciona lote y tipo de evento';
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        _successMessage = null;
      });
    }

    try {
      double? parseDouble(TextEditingController controller) {
        final value = controller.text.trim();
        if (value.isEmpty) return null;
        return double.tryParse(value.replaceAll(',', '.'));
      }

      int? parseInt(TextEditingController controller) {
        final value = controller.text.trim();
        if (value.isEmpty) return null;
        return int.tryParse(value);
      }

      final volumenLitros = parseDouble(_volumenLitrosController);
      final duracionMinutos = parseInt(_duracionMinController);
      final dosisGramos = parseDouble(_dosisGramosController);
      final concentracionPpm = parseDouble(_concentracionPpmController);
      final dosisProducto = parseDouble(_dosisProductoController);
      final pesoKg = parseDouble(_pesoKgController);
      final cantidadPlantas = parseInt(_cantidadPlantasController);
      final rendimientoEstimado = parseDouble(_rendimientoEstimadoController);
      final temperaturaAmbientalC = parseDouble(_temperaturaAmbientalController);
      final humedadRelativaPct = parseDouble(_humedadAmbientalController);

      // Registrar evento en el backend
      final nuevoEvento = await _apiService.registrarEvento(
        loteId: _selectedLote!.id,
        tipoEvento: _selectedEventType!,
        descripcion: _descriptionController.text.isNotEmpty 
          ? _descriptionController.text 
          : null,
        volumenLitros: volumenLitros,
        duracionMinutos: duracionMinutos,
        metodoRiego: _metodoRiegoController.text.trim().isEmpty ? null : _metodoRiegoController.text.trim(),
        tipoInsumo: _tipoInsumoController.text.trim().isEmpty ? null : _tipoInsumoController.text.trim(),
        dosisGramos: dosisGramos,
        metodoAplicacion: _metodoAplicacionController.text.trim().isEmpty ? null : _metodoAplicacionController.text.trim(),
        concentracionPpm: concentracionPpm,
        tipoPlaga: _tipoPlagaController.text.trim().isEmpty ? null : _tipoPlagaController.text.trim(),
        severidad: _severidadPlaga,
        accionTomada: _accionTomadaController.text.trim().isEmpty ? null : _accionTomadaController.text.trim(),
        productoUtilizado: _productoUtilizadoController.text.trim().isEmpty ? null : _productoUtilizadoController.text.trim(),
        dosisProducto: dosisProducto,
        pesoKg: pesoKg,
        calidadVisual: _calidadVisualCosecha,
        cantidadPlantas: cantidadPlantas,
        rendimientoEstimado: rendimientoEstimado,
        observaciones: _observacionesController.text.trim().isEmpty ? null : _observacionesController.text.trim(),
        temperaturaAmbientalC: temperaturaAmbientalC,
        humedadRelativaPct: humedadRelativaPct,
        registradoPorDispositivo: _dispositivoController.text.trim().isEmpty ? null : _dispositivoController.text.trim(),
      );

      await _apiService.simularLecturaDesdeEvento(
        loteId: _selectedLote!.id,
        tipoEvento: _selectedEventType!,
        temperaturaAmbientalC: temperaturaAmbientalC,
        humedadRelativaPct: humedadRelativaPct,
        volumenLitros: volumenLitros,
        duracionMinutos: duracionMinutos,
        concentracionPpm: concentracionPpm,
        dosisGramos: dosisGramos,
        severidad: _severidadPlaga,
        rendimientoEstimado: rendimientoEstimado,
      );

      if (mounted) {
        setState(() {
          _successMessage = 'Evento registrado exitosamente';
          _clearForm();
        });
      }

      // Mostrar mensaje de éxito
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Evento ${nuevoEvento.tipoEventoLabel} registrado y variables de sensor actualizadas'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al registrar evento: $e';
        });
      }
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _temperaturaAmbientalController.dispose();
    _humedadAmbientalController.dispose();
    _volumenLitrosController.dispose();
    _duracionMinController.dispose();
    _metodoRiegoController.dispose();
    _tipoInsumoController.dispose();
    _dosisGramosController.dispose();
    _metodoAplicacionController.dispose();
    _concentracionPpmController.dispose();
    _tipoPlagaController.dispose();
    _accionTomadaController.dispose();
    _productoUtilizadoController.dispose();
    _dosisProductoController.dispose();
    _pesoKgController.dispose();
    _cantidadPlantasController.dispose();
    _rendimientoEstimadoController.dispose();
    _observacionesController.dispose();
    _dispositivoController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _descriptionController.clear();
    _temperaturaAmbientalController.clear();
    _humedadAmbientalController.clear();
    _volumenLitrosController.clear();
    _duracionMinController.clear();
    _metodoRiegoController.clear();
    _tipoInsumoController.clear();
    _dosisGramosController.clear();
    _metodoAplicacionController.clear();
    _concentracionPpmController.clear();
    _tipoPlagaController.clear();
    _accionTomadaController.clear();
    _productoUtilizadoController.clear();
    _dosisProductoController.clear();
    _pesoKgController.clear();
    _cantidadPlantasController.clear();
    _rendimientoEstimadoController.clear();
    _observacionesController.clear();
    _dispositivoController.clear();
    _selectedEventType = null;
    _severidadPlaga = null;
    _calidadVisualCosecha = null;
  }

  Widget _numberField(String label, TextEditingController controller, {String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          filled: true,
          fillColor: Colors.grey[100],
        ),
      ),
    );
  }

  Widget _textField(String label, TextEditingController controller, {String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          filled: true,
          fillColor: Colors.grey[100],
        ),
      ),
    );
  }

  Widget _buildSpecializedFields() {
    if (_selectedEventType == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.orange.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Datos técnicos del evento',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 12),
          _numberField('Temperatura ambiental (°C)', _temperaturaAmbientalController, hint: 'Ej: 25.5'),
          _numberField('Humedad relativa (%)', _humedadAmbientalController, hint: 'Ej: 68'),
          _textField('Registrado por dispositivo', _dispositivoController, hint: 'Ej: app_movil, nodomcu-01'),
          if (_selectedEventType == 'riego') ...[
            _numberField('Volumen aplicado (L)', _volumenLitrosController),
            _numberField('Duración (min)', _duracionMinController),
            _textField('Método de riego', _metodoRiegoController, hint: 'goteo, aspersión...'),
          ],
          if (_selectedEventType == 'fertilizacion') ...[
            _textField('Tipo de insumo', _tipoInsumoController),
            _numberField('Dosis (g)', _dosisGramosController),
            _textField('Método de aplicación', _metodoAplicacionController),
            _numberField('Concentración (ppm)', _concentracionPpmController),
          ],
          if (_selectedEventType == 'plagas') ...[
            _textField('Tipo de plaga', _tipoPlagaController),
            TextField(
              decoration: InputDecoration(
                labelText: 'Severidad',
                hintText: 'leve, moderada, grave',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: Colors.grey[100],
              ),
              onChanged: (value) {
                _severidadPlaga = value.trim().isEmpty ? null : value.trim();
              },
            ),
            const SizedBox(height: 12),
            _textField('Acción tomada', _accionTomadaController),
            _textField('Producto utilizado', _productoUtilizadoController),
            _numberField('Dosis producto (ml/L)', _dosisProductoController),
          ],
          if (_selectedEventType == 'cosecha') ...[
            _numberField('Peso cosechado (kg)', _pesoKgController),
            DropdownButtonFormField<String>(
              value: _calidadVisualCosecha,
              decoration: InputDecoration(
                labelText: 'Calidad visual',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: Colors.grey[100],
              ),
              items: const [
                DropdownMenuItem(value: 'excelente', child: Text('Excelente')),
                DropdownMenuItem(value: 'buena', child: Text('Buena')),
                DropdownMenuItem(value: 'aceptable', child: Text('Aceptable')),
                DropdownMenuItem(value: 'deficiente', child: Text('Deficiente')),
              ],
              onChanged: (value) {
                if (mounted) {
                  setState(() {
                    _calidadVisualCosecha = value;
                  });
                }
              },
            ),
            const SizedBox(height: 12),
            _numberField('Cantidad de plantas', _cantidadPlantasController),
            _numberField('Rendimiento estimado (kg)', _rendimientoEstimadoController),
          ],
          _textField('Observaciones técnicas', _observacionesController),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              color: AgroTheme.darkGreen.withOpacity(0.1),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Registrar Evento',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Registra eventos y acciones en tus lotes',
                    style: TextStyle(
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Seleccionar lote
                  const Text(
                    'Lote',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
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
                      if (mounted) {
                        setState(() {
                          _selectedLote = lote;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 24),

                  // Seleccionar tipo de evento
                  const Text(
                    'Tipo de Evento',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _eventTypes.map((type) {
                      return ChoiceChip(
                        label: Text(
                          type.replaceAll('_', ' ').toUpperCase(),
                        ),
                        selected: _selectedEventType == type,
                        onSelected: (selected) {
                          if (mounted) {
                            setState(() {
                              _selectedEventType = selected ? type : null;
                            });
                          }
                        },
                        selectedColor: AgroTheme.darkGreen,
                        labelStyle: TextStyle(
                          color: _selectedEventType == type 
                            ? Colors.white 
                            : Colors.black,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  _buildSpecializedFields(),

                  // Descripción
                  const Text(
                    'Descripción (opcional)',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _descriptionController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Describe el evento con detalles importantes',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Mensaje de error
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error, color: Colors.red),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ),

                  if (_successMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _successMessage!,
                              style: const TextStyle(color: Colors.green),
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Botón registrar
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _registrarEvento,
                      icon: _isLoading
                        ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                        : const Icon(Icons.save),
                      label: Text(
                        _isLoading ? 'Registrando...' : 'Registrar Evento',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Información adicional
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.blue.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.info,
                              color: Colors.blue.shade700,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Información',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Registrar eventos es importante para:\n'
                          '• Rastrear acciones realizadas en el cultivo\n'
                          '• Correlacionar cambios con mediciones de sensores\n'
                          '• Mantener un historial de mantenimiento\n'
                          '• Evaluar reacciones del cultivo a las intervenciones',
                          style: TextStyle(
                            color: Colors.blue.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
