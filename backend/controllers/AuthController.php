<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JwtHandler.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class AuthController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->email) || !isset($data->password)) {
            Response::json(400, false, "El correo y la contraseña son obligatorios.");
        }

        $stmt = $this->db->prepare("SELECT id, name, email, password, role_id, status FROM users WHERE email = :email LIMIT 1");
        $stmt->bindParam(":email", $data->email);
        $stmt->execute();
        $user = $stmt->fetch();

        if (!$user || !password_verify($data->password, $user['password'])) {
            Response::json(401, false, "Credenciales incorrectas.");
        }

        if ($user['status'] == 0) {
            Response::json(403, false, "El usuario está inactivo. Contacte al administrador.");
        }

        $stmtMods = $this->db->prepare("SELECT m.name FROM role_modules rm JOIN modules m ON rm.module_id = m.id WHERE rm.role_id = :role_id");
        $stmtMods->bindParam(":role_id", $user['role_id']);
        $stmtMods->execute();
        $modules = $stmtMods->fetchAll(PDO::FETCH_COLUMN);

        $token = JwtHandler::encode($user['id'], $user['role_id'], $modules);

        Response::json(200, true, "Login exitoso", [
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role_id" => $user['role_id'],
                "modules" => $modules
            ]
        ]);
    }

    public function forgotPassword() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->email)) Response::json(400, false, "El correo es obligatorio.");

        $stmt = $this->db->prepare("SELECT id, name FROM users WHERE email = :email");
        $stmt->bindParam(":email", $data->email);
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user) {
            $token = bin2hex(random_bytes(32)); // Token seguro de 64 caracteres
            $expires = date("Y-m-d H:i:s", strtotime('+1 hour'));

            $updateStmt = $this->db->prepare("UPDATE users SET reset_token = :token, reset_token_expires = :expires WHERE id = :id");
            $updateStmt->execute([':token' => $token, ':expires' => $expires, ':id' => $user['id']]);

            // Configuración de PHPMailer
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host       = MAIL_HOST;
                $mail->SMTPAuth   = true;
                $mail->Username   = MAIL_USER;
                $mail->Password   = MAIL_PASS;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                $mail->Port       = MAIL_PORT;
                $mail->CharSet    = 'UTF-8';

                $mail->setFrom(MAIL_USER, 'Hogares Infantiles APP');
                $mail->addAddress($data->email, $user['name']);

                $resetLink = "http://localhost:5173/reset-password?token=" . $token; // URL de React (Desarrollo)

                $mail->isHTML(true);
                $mail->Subject = 'Recuperación de Contraseña';
                $mail->Body    = "Hola {$user['name']},<br>Para recuperar tu contraseña haz clic en el siguiente enlace. Este enlace expira en 1 hora.<br><br><a href='{$resetLink}'>Restablecer Contraseña</a>";

                // Descomentar en producción: $mail->send();
            } catch (Exception $e) {
                // Falla silenciosa o logs
            }
        }
        // Siempre se devuelve OK para evitar enumeración de usuarios (Seguridad)
        Response::json(200, true, "Si el correo existe, se han enviado las instrucciones.");
    }

    public function resetPassword() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->token) || !isset($data->password)) {
            Response::json(400, false, "Datos incompletos.");
        }

        $now = date("Y-m-d H:i:s");
        $stmt = $this->db->prepare("SELECT id FROM users WHERE reset_token = :token AND reset_token_expires > :now");
        $stmt->execute([':token' => $data->token, ':now' => $now]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::json(400, false, "El token es inválido o ha expirado.");
        }

        $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);
        $updateStmt = $this->db->prepare("UPDATE users SET password = :pwd, reset_token = NULL, reset_token_expires = NULL WHERE id = :id");
        $updateStmt->execute([':pwd' => $hashedPassword, ':id' => $user['id']]);

        Response::json(200, true, "Contraseña actualizada exitosamente.");
    }
}