import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool isLoggedIn = false;
  String? userEmail;
  String? userName;
  String? userRole;
  String? errorMessage;
  bool isLoading = false;

  AuthProvider() {
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    isLoggedIn = token != null && token.isNotEmpty;
    userEmail = prefs.getString('user_email');
    userName = prefs.getString('user_name');
    userRole = prefs.getString('user_role');
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);
      
      if (response != null && response['token'] != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', response['token']);
        await prefs.setString('user_email', email);
        
        // Si tenemos datos del usuario en la respuesta
        if (response['usuario'] != null) {
          final usuario = response['usuario'];
          await prefs.setString('user_name', usuario['nombre_completo'] ?? 'Usuario');
          await prefs.setString('user_role', usuario['rol'] ?? 'agricultor');
          userName = usuario['nombre_completo'];
          userRole = usuario['rol'];
        }
        
        userEmail = email;
        isLoggedIn = true;
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = 'Credenciales inválidas';
        isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      errorMessage = 'Error al iniciar sesión: $e';
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password, String fullName) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.register(email, password, fullName);
      
      if (response != null && response['success'] == true) {
        // Auto-login después del registro
        return await login(email, password);
      } else {
        errorMessage = response?['message'] ?? 'Error al registrarse';
        isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      errorMessage = 'Error al registrarse: $e';
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
    await prefs.remove('user_role');
    
    isLoggedIn = false;
    userEmail = null;
    userName = null;
    userRole = null;
    notifyListeners();
  }
}
