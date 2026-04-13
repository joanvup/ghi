<?php
// Configuración estricta de errores para desarrollo
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuración de Zona Horaria
date_default_timezone_set('America/Bogota');

// =========================================================================
// URL DEL FRONTEND (Para los correos de recuperación)
// =========================================================================
// En desarrollo local (Vite)
define('APP_FRONTEND_URL', 'http://localhost:5173'); 
// Cuando subas a cPanel, cambiarás esto por:
// define('APP_FRONTEND_URL', 'https://www.tudominio.com');

// Constantes de Base de Datos
define('DB_HOST', 'localhost');
define('DB_USER', 'ghi'); // Cambia esto si tu usuario MySQL es distinto
define('DB_PASS', '5ip1T8S2fEMe');     // Cambia esto por tu contraseña de MySQL
define('DB_NAME', 'hogares_infantiles');
define('DB_CHARSET', 'utf8mb4');

// Constantes de Seguridad (JWT)
define('JWT_SECRET', 'HogaresInfantiles_S3cr3tK3y_2024!_ChangeThisInProduction');
define('JWT_ISSUER', 'http://localhost'); 
define('JWT_AUDIENCE', 'http://localhost');
define('JWT_EXPIRATION', 3600 * 8); // 8 horas de sesión

// Configuración de Correo (Recuperación de contraseña)
//define('MAIL_HOST', 'smtp.ejemplo.com'); // Cambiar por SMTP de cPanel en prod
//define('MAIL_USER', 'no-reply@tudominio.com');
//define('MAIL_PASS', 'tu_password_smtp');
//define('MAIL_PORT', 465);

// ==========================================
// EJEMPLO DE CONFIGURACIÓN CON GMAIL (Local)
// ==========================================
define('MAIL_HOST', 'smtp.gmail.com'); 
define('MAIL_USER', 'fotocopiadora@colegiobilingue.edu.co'); 
// OJO: NO uses tu clave normal, debes generar una "Contraseña de aplicación" en tu cuenta de Google.
define('MAIL_PASS', 'ypsn sore qkss bequ'); 
define('MAIL_PORT', 465); // Puerto seguro para SMTP