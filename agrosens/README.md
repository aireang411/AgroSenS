# 🌿 AgroSenS — Aplicación Móvil Flutter

**Proyecto Integrador III · Universidad Pontificia Bolivariana**  
**Estudiante:** Carlos Fernando Ortiz Vargas  
**Asignatura:** Proyecto Integrador III  
**Docente:** Omar Pinzon Ardila

---

## 📱 Descripción

AgroSenS es una aplicación móvil Flutter para la gestión predictiva de cultivos bajo invernadero. Transforma datos ambientales y edáficos en recomendaciones accionables para agricultores.

### Pantallas incluidas:

| Pantalla | Función |
|---|---|
| **Dashboard (Inicio)** | Estado semafórico de cultivos + gráfica DPV animada en tiempo real |
| **Alertas** | Alertas predictivas con recomendaciones paso a paso expandibles |
| **Historial** | Gráficas de temperatura/humedad 24h + registro de eventos |
| **Registrar** | Formulario de registro de eventos manuales con slider DPV |

---

## 🚀 Cómo correr el proyecto

### 1. Requisitos previos

- **Flutter SDK** versión 3.0 o superior  
  → Descarga: https://flutter.dev/docs/get-started/install
- **Android Studio** o **VS Code** con extensión Flutter
- **Git** instalado

### 2. Clonar / abrir el proyecto

Si te enviaron el ZIP, extráelo y abre la carpeta `agrosens/` en tu IDE.

### 3. Instalar dependencias

```bash
cd agrosens
flutter pub get
```

### 4. Correr en emulador o dispositivo físico

```bash
# Ver dispositivos disponibles
flutter devices

# Correr en Android (emulador o celular con USB debugging)
flutter run

# Correr en modo release (más rápido)
flutter run --release
```

### 5. Generar APK para compartir

```bash
flutter build apk --release
```

El APK se genera en: `build/app/outputs/flutter-apk/app-release.apk`

---

## 📦 Dependencias

```yaml
fl_chart: ^0.68.0       # Gráficas (DPV, temperatura, humedad)
google_fonts: ^6.1.0    # Tipografía Inter
intl: ^0.19.0           # Formateo de fechas
```

---

## 🏗️ Estructura del proyecto

```
lib/
├── main.dart                    # Punto de entrada + navegación principal
├── theme.dart                   # Colores, tipografía, temas claro/oscuro
├── models/
│   └── models.dart              # Modelos de datos (Lote, Alerta, Evento...)
├── widgets/
│   └── widgets.dart             # Widgets reutilizables (Semáforo, TarjetaCultivo...)
└── screens/
    ├── dashboard_screen.dart    # Pantalla Inicio
    ├── alertas_screen.dart      # Pantalla Alertas
    ├── historial_screen.dart    # Pantalla Historial
    └── registro_screen.dart     # Pantalla Registrar
```

---

## 🎨 Diseño

- **Paleta:** Verde oscuro `#1A3A2E` como color primario
- **Estados semafóricos:** 🟢 Óptimo / 🟡 Preventivo / 🔴 Crítico
- **Modo oscuro:** Soporte completo con toggle en el AppBar
- **Tipografía:** Inter (Google Fonts)
- **Compatibilidad:** Android 9.0+ / iOS 13.0+

---

## 🔧 Próximos pasos (Versión 2)

1. **Integración real con sensores** via MQTT/API REST
2. **Firebase** para notificaciones push reales
3. **Autenticación** con JWT (RF-SEC-01)
4. **Backend FastAPI/Node.js** con cálculo de DPV real
5. **Modo offline** con SQLite local
6. **Gestión de nodos** (RF-ADM-01)

---

## 📞 Soporte

Si tienes problemas corriendo el proyecto:
- `flutter doctor` para diagnosticar el entorno
- Revisar que `flutter pub get` haya completado sin errores
