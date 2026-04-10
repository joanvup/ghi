<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/config.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHandler {
    public static function encode($userId, $roleId, $modules) {
        $issuedAt = time();
        $expire = $issuedAt + JWT_EXPIRATION;

        $payload = [
            'iss'  => JWT_ISSUER,
            'aud'  => JWT_AUDIENCE,
            'iat'  => $issuedAt,
            'exp'  => $expire,
            'data' => [
                'user_id' => $userId,
                'role_id' => $roleId,
                'modules' => $modules // Array de nombres de módulos
            ]
        ];

        return JWT::encode($payload, JWT_SECRET, 'HS256');
    }

    public static function decode($token) {
        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
            return (array) $decoded->data;
        } catch (Exception $e) {
            return null; // Token inválido o expirado
        }
    }
}