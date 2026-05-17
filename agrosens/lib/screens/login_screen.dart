import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isRegisterMode = false;
  final _fullNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Cargar credenciales de prueba
    _emailController.text = 'agricultor@agrosens.com';
    _passwordController.text = 'test123';
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fullNameController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showError('Por favor completa todos los campos');
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(
      _emailController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      // El main.dart maneja la navegación automáticamente
      Navigator.of(context).pushReplacementNamed('/');
    } else {
      _showError(authProvider.errorMessage ?? 'Error desconocido');
    }
  }

  Future<void> _handleRegister() async {
    if (_emailController.text.isEmpty || 
        _passwordController.text.isEmpty ||
        _fullNameController.text.isEmpty) {
      _showError('Por favor completa todos los campos');
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.register(
      _emailController.text,
      _passwordController.text,
      _fullNameController.text,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushReplacementNamed('/');
    } else {
      _showError(authProvider.errorMessage ?? 'Error desconocido');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AgroTheme.darkGreen,
              AgroTheme.darkGreen.withOpacity(0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Consumer<AuthProvider>(
                builder: (context, authProvider, _) {
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo/Encabezado
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.eco,
                          size: 80,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Título
                      Text(
                        'AgroSenS',
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Subtítulo
                      Text(
                        _isRegisterMode ? 'Crear cuenta' : 'Monitoreo inteligente de estrés hídrico',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.8),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 48),

                      // Email
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Correo electrónico',
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
                          prefixIcon: Icon(Icons.email, color: Colors.white.withOpacity(0.7)),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.1),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Colors.white),
                          ),
                        ),
                        enabled: !authProvider.isLoading,
                      ),
                      const SizedBox(height: 16),

                      // Nombre completo (solo en registro)
                      if (_isRegisterMode)
                        Column(
                          children: [
                            TextField(
                              controller: _fullNameController,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Nombre completo',
                                hintStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
                                prefixIcon: Icon(Icons.person, color: Colors.white.withOpacity(0.7)),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.1),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Colors.white),
                                ),
                              ),
                              enabled: !authProvider.isLoading,
                            ),
                            const SizedBox(height: 16),
                          ],
                        ),

                      // Contraseña
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Contraseña',
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
                          prefixIcon: Icon(Icons.lock, color: Colors.white.withOpacity(0.7)),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off : Icons.visibility,
                              color: Colors.white.withOpacity(0.7),
                            ),
                            onPressed: () {
                              if (mounted) {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              }
                            },
                          ),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.1),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Colors.white),
                          ),
                        ),
                        enabled: !authProvider.isLoading,
                      ),
                      const SizedBox(height: 24),

                      // Botón Login/Register
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: authProvider.isLoading
                            ? null
                            : (_isRegisterMode ? _handleRegister : _handleLogin),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            disabledBackgroundColor: Colors.white.withOpacity(0.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: authProvider.isLoading
                            ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                            : Text(
                              _isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión',
                              style: TextStyle(
                                color: AgroTheme.darkGreen,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Toggle entre login y registro
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _isRegisterMode 
                              ? '¿Ya tienes cuenta? '
                              : '¿No tienes cuenta? ',
                            style: TextStyle(color: Colors.white.withOpacity(0.7)),
                          ),
                          GestureDetector(
                            onTap: authProvider.isLoading
                              ? null
                              : () {
                                if (mounted) {
                                  setState(() {
                                    _isRegisterMode = !_isRegisterMode;
                                    _fullNameController.clear();
                                  });
                                }
                              },
                            child: Text(
                              _isRegisterMode ? 'Inicia sesión' : 'Regístrate',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // Hint de credenciales
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Credenciales de prueba:',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Email: agricultor@agrosens.com\nContraseña: test123',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.8),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
