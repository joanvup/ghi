<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class UserController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function index() {
        $stmt = $this->db->query("SELECT u.id, u.name, u.email, u.status, r.name as role_name, u.role_id 
                                  FROM users u 
                                  JOIN roles r ON u.role_id = r.id");
        Response::json(200, true, "Usuarios obtenidos", $stmt->fetchAll());
    }

    public function store() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->name) || !isset($data->email) || !isset($data->password) || !isset($data->role_id)) {
            Response::json(400, false, "Faltan datos requeridos.");
        }

        $stmtCheck = $this->db->prepare("SELECT id FROM users WHERE email = :email");
        $stmtCheck->bindParam(":email", $data->email);
        $stmtCheck->execute();
        if ($stmtCheck->fetch()) {
            Response::json(400, false, "El correo ya está registrado.");
        }

        $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare("INSERT INTO users (role_id, name, email, password, status) VALUES (:role_id, :name, :email, :password, 1)");
        $stmt->bindParam(":role_id", $data->role_id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":password", $hashedPassword);
        
        if ($stmt->execute()) {
            Response::json(201, true, "Usuario creado exitosamente.");
        } else {
            Response::json(500, false, "Error al crear el usuario.");
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->name) || !isset($data->email) || !isset($data->role_id)) {
            Response::json(400, false, "Faltan datos requeridos.");
        }

        $stmt = $this->db->prepare("UPDATE users SET name = :name, email = :email, role_id = :role_id, status = :status WHERE id = :id");
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":role_id", $data->role_id);
        $stmt->bindValue(":status", isset($data->status) ? $data->status : 1);
        $stmt->bindParam(":id", $id);

        if ($stmt->execute()) {
            Response::json(200, true, "Usuario actualizado exitosamente.");
        } else {
            Response::json(500, false, "Error al actualizar el usuario.");
        }
    }

    public function destroy($id) {
        // Soft delete (Desactivar) en vez de borrar para mantener historial de seguimientos
        $stmt = $this->db->prepare("UPDATE users SET status = 0 WHERE id = :id");
        $stmt->bindParam(":id", $id);
        if ($stmt->execute()) {
            Response::json(200, true, "Usuario desactivado exitosamente.");
        } else {
            Response::json(500, false, "Error al desactivar el usuario.");
        }
    }
}