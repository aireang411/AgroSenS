// ============================================================
// SERVICIO DE SIMULACIÓN DE DATOS
// Genera variaciones realistas de datos de monitoreo de cultivos
// ============================================================

import db from '../config/database';
import logger from '../utils/logger';

interface SensorSimulation {
  id_sensor: number;
  id_lote: number;
  temperatura: number;
  humedad: number;
}

class SimulationService {
  /**
   * Generar valor aleatorio dentro de rango con variación pequeña
   */
  private static randomVariation(current: number, range: number): number {
    const variation = (Math.random() - 0.5) * range;
    return current + variation;
  }

  /**
   * Calcular DPV (Deficit de Presión de Vapor)
   * DPV = (Presión vapor saturación - Presión vapor real)
   * Basado en Temperatura y Humedad
   */
  private static calculateDPV(temperature: number, humidity: number): number {
    // Ecuación aproximada de Magnus para presión vapor saturación (en kPa)
    const es = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
    
    // Presión vapor real
    const ea = (humidity / 100) * es;
    
    // DPV
    return Math.max(0, es - ea);
  }

  /**
   * Generar lectura simulada realista
   */
  private static generateRealisticReading(previousReading?: any) {
    const now = new Date();
    
    // Valores base según hora del día para simular ciclo diario
    const hour = now.getHours();
    const dayProgress = (hour + now.getMinutes() / 60) / 24;
    
    // Temperatura: Más alta al mediodía, más baja en madrugada (18-32°C)
    const tempBase = 25 + 7 * Math.sin((dayProgress - 0.25) * Math.PI * 2);
    const temperature = this.randomVariation(tempBase, 2);
    
    // Humedad: Inversa a temperatura (40-95%)
    const humidityBase = 65 - 25 * Math.sin((dayProgress - 0.25) * Math.PI * 2);
    const humidity = Math.max(40, Math.min(95, this.randomVariation(humidityBase, 5)));
    
    // DPV calculado
    const dpv = this.calculateDPV(temperature, humidity);
    
    // Presión vapor saturación
    const presionVaporSaturacion = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
    
    // Presión vapor real
    const presionVaporReal = (humidity / 100) * presionVaporSaturacion;

    return {
      temperatura_celsius: Math.round(temperature * 10) / 10,
      humedad_relativa: Math.round(humidity * 10) / 10,
      dpv_calculado: Math.round(dpv * 100) / 100,
      presion_vapor_saturacion: Math.round(presionVaporSaturacion * 100) / 100,
      presion_vapor_real: Math.round(presionVaporReal * 100) / 100,
      valida: true,
      timestamp: new Date()
    };
  }

  /**
   * Generar múltiples lecturas simuladas para llenar histórico
   */
  static async generateHistoricalData(idLote: number, idSensor: number, hoursBack: number = 24) {
    try {
      const readings: any[] = [];
      const now = new Date();

      // Generar una lectura cada 30 minutos
      for (let i = hoursBack * 2; i >= 0; i--) {
        const readingTime = new Date(now.getTime() - i * 30 * 60 * 1000);
        const reading = this.generateRealisticReading();

        readings.push({
          id_sensor: idSensor,
          id_lote: idLote,
          temperatura_celsius: reading.temperatura_celsius,
          humedad_relativa: reading.humedad_relativa,
          dpv_calculado: reading.dpv_calculado,
          presion_vapor_saturacion: reading.presion_vapor_saturacion,
          presion_vapor_real: reading.presion_vapor_real,
          valida: reading.valida,
          timestamp: readingTime
        });
      }

      // Insertar en base de datos
      for (const reading of readings) {
        await db.query(
          `INSERT INTO lecturas_sensores 
           (id_sensor, id_lote, temperatura_celsius, humedad_relativa, dpv_calculado, 
            presion_vapor_saturacion, presion_vapor_real, valida, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            reading.id_sensor,
            reading.id_lote,
            reading.temperatura_celsius,
            reading.humedad_relativa,
            reading.dpv_calculado,
            reading.presion_vapor_saturacion,
            reading.presion_vapor_real,
            reading.valida,
            reading.timestamp
          ]
        );
      }

      logger.info(`Generadas ${readings.length} lecturas simuladas para lote ${idLote}`);
      return readings;
    } catch (error) {
      logger.error('Error generando datos históricos:', error);
      throw error;
    }
  }

  /**
   * Generar una lectura simulada actual para un sensor
   */
  static async generateSingleReading(idSensor: number, idLote: number) {
    try {
      const reading = this.generateRealisticReading();

      const result = await db.one(
        `INSERT INTO lecturas_sensores 
         (id_sensor, id_lote, temperatura_celsius, humedad_relativa, dpv_calculado, 
          presion_vapor_saturacion, presion_vapor_real, valida, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id_lectura, timestamp, temperatura_celsius, humedad_relativa, dpv_calculado, 
                   presion_vapor_saturacion, presion_vapor_real`,
        [
          idSensor,
          idLote,
          reading.temperatura_celsius,
          reading.humedad_relativa,
          reading.dpv_calculado,
          reading.presion_vapor_saturacion,
          reading.presion_vapor_real,
          reading.valida
        ]
      );

      logger.info(`Lectura simulada generada para sensor ${idSensor}`);
      return result;
    } catch (error) {
      logger.error('Error generando lectura simulada:', error);
      throw error;
    }
  }

  /**
   * Generar lecturas para todos los sensores de un lote
   */
  static async generateReadingsForLote(idLote: number) {
    try {
      // Obtener todos los sensores del lote
      const sensores = await db.query(
        `SELECT id_sensor FROM sensores WHERE id_lote = $1`,
        [idLote]
      );

      const readings: any[] = [];

      for (const sensor of sensores) {
        const reading = await this.generateSingleReading(sensor.id_sensor, idLote);
        readings.push(reading);
      }

      logger.info(`Generadas ${readings.length} lecturas para lote ${idLote}`);
      return readings;
    } catch (error) {
      logger.error('Error generando lecturas para lote:', error);
      throw error;
    }
  }

  /**
   * Generar lecturas para todos los lotes del usuario
   */
  static async generateReadingsForAllUserLotes(idUsuario: number) {
    try {
      // Obtener todos los lotes del usuario
      const lotes = await db.query(
        `SELECT id_lote FROM lotes WHERE id_usuario = $1`,
        [idUsuario]
      );

      let totalReadings = 0;

      for (const lote of lotes) {
        const readings = await this.generateReadingsForLote(lote.id_lote);
        totalReadings += readings.length;
      }

      logger.info(`Generadas ${totalReadings} lecturas totales para usuario ${idUsuario}`);
      return totalReadings;
    } catch (error) {
      logger.error('Error generando lecturas para usuario:', error);
      throw error;
    }
  }

  /**
   * Simular cambios continuos en un lote (ideal para modo demo)
   */
  static async startContinuousSimulation(idLote: number, intervalMs: number = 60000) {
    try {
      logger.info(`Iniciando simulación continua para lote ${idLote} cada ${intervalMs}ms`);

      const interval = setInterval(async () => {
        try {
          await this.generateReadingsForLote(idLote);
        } catch (error) {
          logger.error('Error durante simulación continua:', error);
        }
      }, intervalMs);

      return interval;
    } catch (error) {
      logger.error('Error iniciando simulación continua:', error);
      throw error;
    }
  }

  /**
   * Detener simulación continua
   */
  static stopContinuousSimulation(interval: NodeJS.Timeout) {
    clearInterval(interval);
    logger.info('Simulación continua detenida');
  }
}

export default SimulationService;
