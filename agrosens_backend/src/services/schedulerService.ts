// ============================================================
// SERVICIO DE PROGRAMACIÓN DE TAREAS (SCHEDULER)
// Ejecuta simulaciones automáticas cada 5 minutos
// ============================================================

import db from '../config/database';
import logger from '../utils/logger';
import SimulationService from './simulationService';

class SchedulerService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Iniciar scheduler de simulación automática
   */
  static start() {
    if (this.isRunning) {
      logger.warn('Scheduler ya está corriendo');
      return;
    }

    this.isRunning = true;
    logger.info('🔄 Iniciando Scheduler de simulación...');

    // Ejecutar inmediatamente
    this.runSimulation();

    // Luego cada 5 minutos
    this.intervalId = setInterval(() => {
      this.runSimulation();
    }, 5 * 60 * 1000); // 5 minutos

    logger.info('✅ Scheduler iniciado - Simulación cada 5 minutos');
  }

  /**
   * Detener scheduler
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('⛔ Scheduler detenido');
  }

  /**
   * Ejecutar simulación completa
   */
  private static async runSimulation() {
    try {
      logger.info('📊 Ejecutando simulación automática...');
      const startTime = Date.now();

      // Obtener todos los lotes activos
      const lotes = await db.manyOrNone(
        'SELECT id_lote FROM lotes WHERE activo = true'
      );

      if (!lotes || lotes.length === 0) {
        logger.info('No hay lotes activos para simular');
        return;
      }

      // Para cada lote, generar datos simulados
      let totalReadingsGenerated = 0;
      let totalEventsGenerated = 0;

      for (const lote of lotes) {
        try {
          // Generar lecturas de sensores
          const readingsCount = await this.generateSensorReadings(lote.id_lote);
          totalReadingsGenerated += readingsCount;

          // Generar eventos operativos simulados (30% de probabilidad)
          if (Math.random() < 0.3) {
            const eventsCount = await this.generateOperationalEvents(lote.id_lote);
            totalEventsGenerated += eventsCount;
          }
        } catch (error) {
          logger.error(`Error simulando lote ${lote.id_lote}:`, error);
        }
      }

      const elapsed = Date.now() - startTime;
      logger.info(
        `✅ Simulación completada: ${totalReadingsGenerated} lecturas, ` +
        `${totalEventsGenerated} eventos (${elapsed}ms)`
      );
    } catch (error) {
      logger.error('Error en simulación automática:', error);
    }
  }

  /**
   * Generar lecturas de sensores para un lote
   */
  private static async generateSensorReadings(idLote: number): Promise<number> {
    try {
      // Obtener sensores del lote
      const sensores = await db.manyOrNone(
        'SELECT id_sensor FROM sensores WHERE id_lote = $1',
        [idLote]
      );

      if (!sensores || sensores.length === 0) {
        return 0;
      }

      let count = 0;
      for (const sensor of sensores) {
        try {
          await SimulationService.generateSingleReading(sensor.id_sensor, idLote);
          count++;
        } catch (error) {
          logger.error(`Error generando lectura para sensor ${sensor.id_sensor}:`, error);
        }
      }

      return count;
    } catch (error) {
      logger.error(`Error generando lecturas para lote ${idLote}:`, error);
      return 0;
    }
  }

  /**
   * Generar eventos operativos simulados
   */
  private static async generateOperationalEvents(idLote: number): Promise<number> {
    try {
      const eventTypes = ['riego', 'fertilizacion', 'plagas', 'cosecha', 'poda', 'mantenimiento'];
      const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      // Obtener usuario del lote
      const lote = await db.oneOrNone(
        'SELECT id_usuario FROM lotes WHERE id_lote = $1',
        [idLote]
      );

      if (!lote) {
        return 0;
      }

      const eventData: any = {
        id_lote: idLote,
        id_usuario: lote.id_usuario,
        tipo_evento: selectedType,
        timestamp: new Date(),
        descripcion: `Evento automático simulado: ${selectedType}`
      };

      // Datos específicos por tipo de evento
      switch (selectedType) {
        case 'riego':
          eventData.volumen_litros = 200 + Math.random() * 400;
          eventData.duracion_minutos = 15 + Math.floor(Math.random() * 45);
          eventData.metodo_riego = ['goteo', 'aspersión', 'microaspersión'][
            Math.floor(Math.random() * 3)
          ];
          eventData.descripcion += ` (${eventData.volumen_litros.toFixed(1)}L)`;
          break;

        case 'fertilizacion':
          eventData.tipo_insumo = ['NPK 20-20-20', 'Urea', 'Potasio', 'Fósforo'][
            Math.floor(Math.random() * 4)
          ];
          eventData.dosis_gramos = 100 + Math.random() * 300;
          eventData.concentracion_ppm = 500 + Math.floor(Math.random() * 800);
          eventData.metodo_aplicacion = 'fertirrigación';
          eventData.descripcion += ` (${eventData.tipo_insumo})`;
          break;

        case 'plagas':
          eventData.tipo_plaga = ['ácaros', 'pulgones', 'mosca blanca', 'trips'][
            Math.floor(Math.random() * 4)
          ];
          eventData.severidad = ['leve', 'moderada', 'grave'][Math.floor(Math.random() * 3)];
          eventData.producto_utilizado = 'Insecticida standard';
          eventData.dosis_producto = 10 + Math.random() * 40;
          eventData.descripcion += ` (${eventData.tipo_plaga}, ${eventData.severidad})`;
          break;

        case 'cosecha':
          eventData.peso_kg = 500 + Math.random() * 2000;
          eventData.calidad_visual = ['excelente', 'buena', 'aceptable'][
            Math.floor(Math.random() * 3)
          ];
          eventData.cantidad_plantas = 100 + Math.floor(Math.random() * 900);
          eventData.descripcion += ` (${eventData.peso_kg.toFixed(1)}kg)`;
          break;

        case 'poda':
          eventData.observaciones = 'Poda de mantenimiento automática';
          break;

        case 'mantenimiento':
          eventData.observaciones = 'Tareas de mantenimiento automático';
          break;
      }

      // Insertar evento
      await db.query(
        `INSERT INTO eventos_operativos (
          id_lote, id_usuario, tipo_evento, descripcion, timestamp,
          volumen_litros, duracion_minutos, metodo_riego,
          tipo_insumo, dosis_gramos, concentracion_ppm, metodo_aplicacion,
          tipo_plaga, severidad, producto_utilizado, dosis_producto,
          peso_kg, calidad_visual, cantidad_plantas,
          observaciones
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20
        )`,
        [
          eventData.id_lote,
          eventData.id_usuario,
          eventData.tipo_evento,
          eventData.descripcion,
          eventData.timestamp,
          eventData.volumen_litros || null,
          eventData.duracion_minutos || null,
          eventData.metodo_riego || null,
          eventData.tipo_insumo || null,
          eventData.dosis_gramos || null,
          eventData.concentracion_ppm || null,
          eventData.metodo_aplicacion || null,
          eventData.tipo_plaga || null,
          eventData.severidad || null,
          eventData.producto_utilizado || null,
          eventData.dosis_producto || null,
          eventData.peso_kg || null,
          eventData.calidad_visual || null,
          eventData.cantidad_plantas || null,
          eventData.observaciones || null
        ]
      );

      return 1;
    } catch (error) {
      logger.error(`Error generando eventos para lote ${idLote}:`, error);
      return 0;
    }
  }
}

export default SchedulerService;
