<?php
require_once __DIR__ . '/../utils/JwtHandler.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {
    // Retorna los datos del usuario si el token es válido, y opcionalmente verifica un módulo
    public static function verify($requiredModule = null) {
        $headers = apache_request_headers();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : null);

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            Response::json(401, false, "Acceso denegado. Token no proporcionado.");
        }

        $token = $matches[1];
        $userData = JwtHandler::decode($token);

        if (!$userData) {
            Response::json(401, false, "Token inválido o expirado. Inicie sesión nuevamente.");
        }

        // Si se requiere un módulo específico, validamos que el usuario lo tenga asignado
        if ($requiredModule !== null) {
            if (!in_array($requiredModule, $userData['modules'])) {
                Response::json(403, false, "Acceso denegado. No tiene permisos para el módulo: " . $requiredModule);
            }
        }

        return $userData;
    }
}