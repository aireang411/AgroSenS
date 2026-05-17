import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme.dart';

class HistorialEventosScreen extends StatefulWidget {
  const HistorialEventosScreen({Key? key}) : super(key: key);

  @override
  State<HistorialEventosScreen> createState() => _HistorialEventosScreenState();
}

class _HistorialEventosScreenState extends State<HistorialEventosScreen> with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  
  late TabController _tabController;
  List<Lote> _lotes = [];
  List<EventoOperativo> _eventos = [];
  Lote? _selectedLote;
  bool _isLoading = true;
  String? _errorMessage;
  String _selectedEventType = 'todos';

  final List<String> _eventTypes = [
    'todos',
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
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
        await _loadEventos();
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

  Future<void> _loadEventos() async {
    if (_selectedLote == null) return;

    try {
      final eventos = await _apiService.obtenerEventosPorLote(_selectedLote!.id, limit: 100);
      // Ordenar de más reciente a más antigua
      eventos.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      
      if (mounted) {
        setState(() {
          _eventos = eventos;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar eventos: $e';
        });
      }
    }
  }

  Future<void> _eliminarEvento(int eventoId) async {
    try {
      final result = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Eliminar Evento'),
          content: const Text('¿Estás seguro de que deseas eliminar este evento?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Eliminar', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      );

      if (result == true) {
        await _apiService.eliminarEvento(eventoId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Evento eliminado exitosamente'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
        await _loadEventos();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al eliminar: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<EventoOperativo> _getFilteredEventos() {
    if (_selectedEventType == 'todos') {
      return _eventos;
    }
    return _eventos.where((e) => e.tipoEvento == _selectedEventType).toList();
  }

  Widget _buildEventoCard(EventoOperativo evento) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Color(int.parse(evento.tipoEventoColor.replaceFirst('#', '0xff'))),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    evento.tipoEventoLabel,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '${evento.timestamp.day}/${evento.timestamp.month} ${evento.timestamp.hour.toString().padLeft(2, '0')}:${evento.timestamp.minute.toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (evento.descripcion != null && evento.descripcion!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  evento.descripcion!,
                  style: const TextStyle(color: Colors.black87),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            // Detalles específicos por tipo
            if (evento.tipoEvento == 'riego')
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (evento.volumenLitros != null)
                    Text('💧 ${evento.volumenLitros}L', style: const TextStyle(fontSize: 13)),
                  if (evento.duracionMinutos != null)
                    Text('⏱ ${evento.duracionMinutos}min', style: const TextStyle(fontSize: 13)),
                  if (evento.metodoRiego != null)
                    Text('${evento.metodoRiego}', style: const TextStyle(fontSize: 13)),
                ],
              )
            else if (evento.tipoEvento == 'fertilizacion')
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (evento.tipoInsumo != null)
                    Text('Insumo: ${evento.tipoInsumo}', style: const TextStyle(fontSize: 13)),
                  if (evento.dosisGramos != null)
                    Text('Dosis: ${evento.dosisGramos}g', style: const TextStyle(fontSize: 13)),
                  if (evento.concentracionPpm != null)
                    Text('Concentración: ${evento.concentracionPpm}ppm', style: const TextStyle(fontSize: 13)),
                ],
              )
            else if (evento.tipoEvento == 'plagas')
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (evento.tipoPlaga != null)
                    Text('Plaga: ${evento.tipoPlaga}', style: const TextStyle(fontSize: 13)),
                  if (evento.severidad != null)
                    Text('Severidad: ${evento.severidad}', style: const TextStyle(fontSize: 13)),
                  if (evento.productoUtilizado != null)
                    Text('Producto: ${evento.productoUtilizado}', style: const TextStyle(fontSize: 13)),
                ],
              )
            else if (evento.tipoEvento == 'cosecha')
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (evento.pesoKg != null)
                    Text('Peso: ${evento.pesoKg}kg', style: const TextStyle(fontSize: 13)),
                  if (evento.calidadVisual != null)
                    Text('Calidad: ${evento.calidadVisual}', style: const TextStyle(fontSize: 13)),
                ],
              ),
            if (evento.observaciones != null && evento.observaciones!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Observaciones:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    Text(
                      evento.observaciones!,
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            // Botones de acción
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () => _eliminarEvento(evento.id),
                    icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                    label: const Text('Eliminar', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                color: AgroTheme.darkGreen.withOpacity(0.1),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Historial de Eventos',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_getFilteredEventos().length} eventos registrados',
                      style: const TextStyle(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Selector de Lote
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
                      _loadEventos();
                    }
                  },
                ),
              ),

              // Filtro por tipo de evento
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _eventTypes.map((type) {
                      final isSelected = _selectedEventType == type;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(type == 'todos' ? 'Todos' : type),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              _selectedEventType = selected ? type : 'todos';
                            });
                          },
                          backgroundColor: Colors.grey[200],
                          selectedColor: AgroTheme.darkGreen,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : Colors.black,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),

              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),

              // Lista de eventos
              Expanded(
                child: _getFilteredEventos().isEmpty
                  ? Center(
                      child: Text(
                        'No hay eventos registrados',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _getFilteredEventos().length,
                      itemBuilder: (context, index) {
                        return _buildEventoCard(_getFilteredEventos()[index]);
                      },
                    ),
              ),
            ],
          ),
    );
  }
}
