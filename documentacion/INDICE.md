# ÍNDICE DE DOCUMENTACIÓN — PROYECTO AgroSenSE

**Proyecto:** AgroSenSE — Aplicación Móvil para la Agroindustria en el Campo de las Hortalizas  
**Estudiante:** Carlos Fernando Ortiz Vargas  
**Asignatura:** Proyecto Integrador III  
**Docente:** Omar Pinzón Ardila  
**Universidad:** Universidad Pontificia Bolivariana — Facultad de Ingeniería de Sistemas e Informática  
**Año:** 2024  

---

## DESCRIPCIÓN GENERAL DEL PROYECTO

AgroSenSE es una aplicación móvil integrada con servicios backend que transforma datos ambientales y edáficos (temperatura, humedad, pH, conductividad eléctrica) en recomendaciones agronómicas predictivas para agricultores de hortalizas bajo invernadero. Su objetivo principal es anticipar el estrés fisiológico en cultivos de lechuga, tomate cherry, pepino y espinaca **antes** de que el daño sea visible, permitiendo una intervención oportuna y eficiente.

**Repositorio GitHub:** https://github.com/aireang411/AgroSenS

---

## ESTRUCTURA DE CARPETAS

```
AgroSenS/
├── 📁 1_diagramas/
├── 📁 2_arquitectura/
├── 📁 3_requerimientos/
├── 📁 4_evidencias/
├── 📁 5_manuales/
├── 📁 6_pruebas/
├── 📁 7_despliegue/
└── 📄 INDICE.md  ← Este archivo
```

---

## 📁 1. DIAGRAMAS

**Ubicación:** `/1_diagramas/`

Contiene todos los diagramas UML y de modelado del sistema AgroSenSE.

| Archivo | Descripción |
|---|---|
| `diagrama_casos_de_uso.png` | Diagrama UML que muestra las interacciones entre los actores (Agricultor, Administrador) y las funcionalidades del sistema |
| `diagrama_clases.png` | Estructura de clases del sistema con atributos y relaciones |
| `diagrama_secuencia_alerta.png` | Flujo de generación de alertas predictivas desde el sensor hasta el móvil |
| `diagrama_actividades.png` | Flujo de actividades del proceso de monitoreo y toma de decisiones |
| `diagrama_estados.png` | Estados posibles del sistema semafórico (Verde/Amarillo/Rojo) |

**Tecnología usada:** Modelado UML estándar (PlantUML / Lucidchart / draw.io)

---

## 📁 2. ARQUITECTURA

**Ubicación:** `/2_arquitectura/`

Contiene los documentos y diagramas que describen la arquitectura técnica del sistema.

| Archivo | Descripción |
|---|---|
| `diagrama_componentes.png` | Diagrama de componentes: Backend (API REST), Frontend Móvil, Capa de Datos y sensores |
| `diagrama_despliegue.png` | Infraestructura de despliegue en la nube (AWS/Azure), dispositivos móviles y nodos sensores |
| `diagrama_entidad_relacion.png` | Modelo ER de la base de datos PostgreSQL con tablas: Usuarios, Sensores, Mediciones, Alertas, Configuracion_Cultivo |
| `arquitectura_sistema.md` | Descripción textual de la arquitectura de capas: Presentación → Lógica de Negocio → Datos |

**Stack tecnológico:**
- **Backend:** API RESTful (Node.js / Python)
- **Base de datos:** PostgreSQL
- **Notificaciones:** Firebase Cloud Messaging (FCM)
- **Protocolo sensores:** MQTT / HTTPS
- **Contenedores:** Docker
- **Móvil:** Flutter (Android 9.0+ / iOS 13.0+)

---

## 📁 3. REQUERIMIENTOS

**Ubicación:** `/3_requerimientos/`

Contiene la documentación formal de requisitos del sistema según el estándar IEEE 830-1998.

| Archivo | Descripción |
|---|---|
| `1_Definicion_del_proyecto_AgroSenS_Informe_Avance.docx` | Documento principal con Marco Teórico, Planteamiento del Problema, Árbol de Problemas, Justificación, Objetivos e Identificación de Stakeholders |
| `2_IEEE_830_1998_SRS_AgroSenSE.docx` | Especificación de Requisitos de Software completa bajo estándar IEEE 830-1998, incluyendo RF (Funcionales) y RNF (No Funcionales) |

**Requerimientos funcionales clave:**
- `RF-AP-01`: Cálculo automático de Déficit de Presión de Vapor (DPV)
- `RF-AP-02`: Detección de tendencias de estrés hídrico
- `RF-AP-03`: Generación de recomendaciones en lenguaje natural
- `RF-AP-04`: Disparo de alertas proactivas (notificaciones push)
- `RF-UX-01`: Visualización de alerta semafórica
- `RF-SEC-01`: Autenticación JWT y control de acceso

---

## 📁 4. EVIDENCIAS

**Ubicación:** `/4_evidencias/`

Contiene las evidencias visuales del desarrollo, diseño de interfaz y validación del producto.

| Archivo | Descripción |
|---|---|
| `mockup_dashboard_principal.png` | Diseño de la pantalla principal con el indicador semafórico (Verde/Amarillo/Rojo) |
| `mockup_detalle_alerta.png` | Pantalla de detalle de alerta con recomendación en lenguaje natural |
| `mockup_historial_dvp.png` | Vista de gráfica de tendencia del DPV de las últimas 24 horas |
| `mockup_login.png` | Pantalla de autenticación de usuario |
| `captura_github_commits.png` | Evidencia del historial de commits organizados en GitHub |

**Nota:** Las interfaces siguen el principio "Cero Interpretación Técnica" con colores semafóricos, tipografía Roboto y áreas táctiles mínimas de 48x48 dp para uso en campo.

---

## 📁 5. MANUALES

**Ubicación:** `/5_manuales/`

Contiene la documentación de uso y configuración del sistema para distintos perfiles de usuario.

| Archivo | Descripción |
|---|---|
| `manual_usuario_agricultor.md` | Guía paso a paso para que el agricultor instale la app, registre su invernadero, interprete el semáforo y responda a las alertas |
| `manual_administrador.md` | Guía técnica para que el administrador registre sensores, configure umbrales por cultivo y etapa fenológica, y gestione usuarios |
| `manual_instalacion_backend.md` | Instrucciones para desplegar el backend en la nube usando Docker y configurar la base de datos PostgreSQL |

**Usuarios objetivo:**
- **Agricultor / Operario:** Formación básica o técnica, uso cotidiano de la app móvil
- **Administrador de Sistemas:** Ingeniería de Sistemas, configuración y mantenimiento de la plataforma

---

## 📁 6. PRUEBAS

**Ubicación:** `/6_pruebas/`

Contiene los casos de prueba, resultados y métricas de validación del sistema.

| Archivo | Descripción |
|---|---|
| `plan_de_pruebas.md` | Estrategia general de pruebas: unitarias, de integración y de usabilidad |
| `casos_de_prueba_RF.xlsx` | Tabla de casos de prueba para cada requerimiento funcional (RF-AP-01 a RF-SEC-01) |
| `resultados_pruebas.md` | Registro de resultados obtenidos: aprobados, fallidos y observaciones |
| `pruebas_rendimiento.md` | Resultados de pruebas de carga: tiempo de respuesta API < 500ms, 50 usuarios concurrentes |

**Métricas objetivo según SRS:**
- ✅ 95% de peticiones API respondidas en < 500 ms
- ✅ Latencia de cálculo DPV < 2 segundos
- ✅ Disponibilidad del backend ≥ 99.5% anual
- ✅ Tasa de error en procesamiento < 1% mensual

---

## 📁 7. DESPLIEGUE

**Ubicación:** `/7_despliegue/`

Contiene la documentación e instrucciones para poner el sistema en funcionamiento en un entorno real.

| Archivo | Descripción |
|---|---|
| `guia_despliegue_nube.md` | Pasos para desplegar el backend en AWS/Azure usando contenedores Docker |
| `configuracion_firebase.md` | Configuración de Firebase Cloud Messaging para notificaciones push |
| `configuracion_mqtt.md` | Configuración del broker MQTT para recepción de datos de sensores |
| `variables_entorno.md` | Lista de variables de entorno necesarias (sin valores sensibles) |
| `checklist_despliegue.md` | Lista de verificación antes del lanzamiento a producción |

**Plataformas de despliegue:**
- **Backend:** AWS Free Tier / Azure Free Tier (contenedor Docker)
- **Base de datos:** PostgreSQL en la nube
- **Notificaciones:** Firebase (Google Cloud)
- **App móvil:** Android 9.0+, distribución directa (.apk) o Google Play

---

## RESUMEN DE ENTREGABLES POR FASE DEL PROYECTO

| Fase | Entregable | Carpeta | Estado |
|---|---|---|---|
| Análisis | Definición del Proyecto | `3_requerimientos/` | ✅ Completado |
| Análisis | SRS IEEE 830-1998 | `3_requerimientos/` | ✅ Completado |
| Diseño | Diagramas UML | `1_diagramas/` | ✅ Completado |
| Diseño | Arquitectura del Sistema | `2_arquitectura/` | ✅ Completado |
| Diseño | Mockups de Interfaz | `4_evidencias/` | ✅ Completado |
| Implementación | Código Fuente (GitHub) | Repositorio | 🔗 Ver enlace |
| Pruebas | Casos y Resultados | `6_pruebas/` | ✅ Completado |
| Despliegue | Guías de Despliegue | `7_despliegue/` | ✅ Completado |
| Documentación | Manuales | `5_manuales/` | ✅ Completado |

---

## REFERENCIAS RÁPIDAS

- **Repositorio GitHub:** https://github.com/aireang411/AgroSenS
- **Estándar aplicado:** IEEE 830-1998 (Software Requirements Specification)
- **Metodología:** Cascada Iterativo (Waterfall Iterativo)
- **Modelo predictivo:** Déficit de Presión de Vapor (DPV / VPD)
- **Cultivos objetivo:** Lechuga, Tomate cherry, Pepino, Espinaca

---

*Documento generado para la entrega final del Proyecto Integrador III — Universidad Pontificia Bolivariana, Bucaramanga, 2024.*
