<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class RoleController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // Obtener todos los roles con sus módulos asignados
    public function index() {
        $stmt = $this->db->query("SELECT * FROM roles");
        $roles = $stmt->fetchAll();

        foreach ($roles as &$role) {
            $stmtMods = $this->db->prepare("SELECT m.id, m.name, m.description FROM role_modules rm JOIN modules m ON rm.module_id = m.id WHERE rm.role_id = :role_id");
            $stmtMods->bindParam(":role_id", $role['id']);
            $stmtMods->execute();
            $role['modules'] = $stmtMods->fetchAll();
        }

        Response::json(200, true, "Roles obtenidos", $roles);
    }

    // Listar todos los módulos disponibles (Para armar los checkboxes en React)
    public function getModules() {
        $stmt = $this->db->query("SELECT * FROM modules");
        Response::json(200, true, "Módulos obtenidos", $stmt->fetchAll());
    }

    // Crear un rol y asignarle módulos
    public function store() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->name) || empty($data->modules) || !is_array($data->modules)) {
            Response::json(400, false, "El nombre del rol y al menos un módulo son requeridos.");
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("INSERT INTO roles (name, description) VALUES (:name, :description)");
            $stmt->bindParam(":name", $data->name);
            $stmt->bindValue(":description", isset($data->description) ? $data->description : null);
            $stmt->execute();
            $roleId = $this->db->lastInsertId();

            $stmtMod = $this->db->prepare("INSERT INTO role_modules (role_id, module_id) VALUES (:role_id, :module_id)");
            foreach ($data->modules as $moduleId) {
                $stmtMod->bindValue(":role_id", $roleId);
                $stmtMod->bindValue(":module_id", $moduleId);
                $stmtMod->execute();
            }

            $this->db->commit();
            Response::json(201, true, "Rol creado exitosamente.");
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::json(500, false, "Error al crear el rol: " . $e->getMessage());
        }
    }

    // Actualizar rol y sincronizar módulos
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->name) || empty($data->modules) || !is_array($data->modules)) {
            Response::json(400, false, "El nombre del rol y al menos un módulo son requeridos.");
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("UPDATE roles SET name = :name, description = :description WHERE id = :id");
            $stmt->bindParam(":name", $data->name);
            $stmt->bindValue(":description", isset($data->description) ? $data->description : null);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            // Eliminar módulos anteriores y registrar los nuevos
            $stmtDel = $this->db->prepare("DELETE FROM role_modules WHERE role_id = :id");
            $stmtDel->bindParam(":id", $id);
            $stmtDel->execute();

            $stmtMod = $this->db->prepare("INSERT INTO role_modules (role_id, module_id) VALUES (:role_id, :module_id)");
            foreach ($data->modules as $moduleId) {
                $stmtMod->bindValue(":role_id", $id);
                $stmtMod->bindValue(":module_id", $moduleId);
                $stmtMod->execute();
            }

            $this->db->commit();
            Response::json(200, true, "Rol actualizado exitosamente.");
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::json(500, false, "Error al actualizar el rol.");
        }
    }
}