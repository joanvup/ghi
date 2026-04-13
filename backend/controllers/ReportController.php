<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class ReportController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Reporte: Niños en Riesgo de Desnutrición (Módulo 4)
    public function getNutritionalRisk() {
        try {
            $sql = "SELECT c.names, c.surnames, c.civil_registry, c.facility, 
                           t.tracking_code, t.tracking_date, u.name as teacher,
                           a.take_number, a.weight_kg, a.height_cm, a.nutritional_classification
                    FROM tracking_anthropometry a
                    JOIN trackings t ON a.tracking_id = t.id
                    JOIN children c ON t.child_id = c.id
                    JOIN users u ON t.created_by = u.id
                    WHERE a.nutritional_classification LIKE '%Desnutrición%' 
                       OR a.nutritional_classification LIKE '%Riesgo%'
                       OR a.nutritional_classification LIKE '%Sobrepeso%'
                       OR a.nutritional_classification LIKE '%Obesidad%'
                    ORDER BY t.tracking_date DESC, c.facility ASC";
            
            $stmt = $this->db->query($sql);
            Response::json(200, true, "Reporte Nutricional", $stmt->fetchAll());
        } catch (\Exception $e) {
            Response::json(500, false, "Error: " . $e->getMessage());
        }
    }

    // 2. Reporte: Estado Pedagógico 'En Riesgo' (Módulo 2)
    public function getPedagogicalRisk() {
        try {
            $sql = "SELECT c.names, c.surnames, c.civil_registry, c.facility, 
                           t.tracking_code, t.tracking_date, u.name as teacher,
                           m2.qualitative_val, m2.qualitative_no_reason, m2.strengths_weaknesses
                    FROM tracking_module2 m2
                    JOIN trackings t ON m2.tracking_id = t.id
                    JOIN children c ON t.child_id = c.id
                    JOIN users u ON t.created_by = u.id
                    WHERE m2.qualitative_val = 'EN RIESGO'
                    ORDER BY t.tracking_date DESC, c.facility ASC";
            
            $stmt = $this->db->query($sql);
            Response::json(200, true, "Reporte Pedagógico", $stmt->fetchAll());
        } catch (\Exception $e) {
            Response::json(500, false, "Error: " . $e->getMessage());
        }
    }

    // 3. Reporte: Alertas de Familia y Derechos (Módulo 3)
    public function getFamilyAlerts() {
        try {
            $sql = "SELECT c.names, c.surnames, c.civil_registry, c.facility, 
                           t.tracking_code, t.tracking_date, u.name as teacher,
                           m3.risk_situations, m3.rights_restoration, m3.routes_articulation
                    FROM tracking_module3 m3
                    JOIN trackings t ON m3.tracking_id = t.id
                    JOIN children c ON t.child_id = c.id
                    JOIN users u ON t.created_by = u.id
                    WHERE m3.risk_situations = 1 
                       OR m3.rights_restoration = 1 
                       OR m3.routes_articulation = 1
                    ORDER BY t.tracking_date DESC, c.facility ASC";
            
            $stmt = $this->db->query($sql);
            Response::json(200, true, "Reporte de Familia", $stmt->fetchAll());
        } catch (\Exception $e) {
            Response::json(500, false, "Error: " . $e->getMessage());
        }
    }

    // 4. Reporte: Alertas de Salud y Vacunas (Módulo 4)
    public function getHealthAlerts() {
        try {
            $sql = "SELECT c.names, c.surnames, c.civil_registry, c.facility, 
                           t.tracking_code, t.tracking_date, u.name as teacher,
                           m4.health_affiliated, m4.vaccines_updated, m4.growth_chart
                    FROM tracking_module4 m4
                    JOIN trackings t ON m4.tracking_id = t.id
                    JOIN children c ON t.child_id = c.id
                    JOIN users u ON t.created_by = u.id
                    WHERE m4.health_affiliated = 0 
                       OR m4.vaccines_updated = 0 
                       OR m4.growth_chart = 0
                    ORDER BY t.tracking_date DESC, c.facility ASC";
            
            $stmt = $this->db->query($sql);
            Response::json(200, true, "Reporte de Salud", $stmt->fetchAll());
        } catch (\Exception $e) {
            Response::json(500, false, "Error: " . $e->getMessage());
        }
    }
}