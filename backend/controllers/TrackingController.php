<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class TrackingController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    private function num($val) {
        return ($val === "" || $val === null) ? null : $val;
    }

    // 1. Obtener listado general de seguimientos (Cabeceras)
    public function index() {
        try {
            $sql = "SELECT 
                        t.id, 
                        t.tracking_code, 
                        t.tracking_date, 
                        t.tracking_time, 
                        t.child_id,
                        c.names AS child_names, 
                        c.surnames AS child_surnames, 
                        c.civil_registry,
                        c.entry_date,
                        c.exit_date,
                        u.name AS created_by_name
                    FROM trackings t
                    INNER JOIN children c ON t.child_id = c.id
                    INNER JOIN users u ON t.created_by = u.id
                    ORDER BY t.tracking_date DESC, t.tracking_time DESC";
            
            $stmt = $this->db->query($sql);
            $results = $stmt->fetchAll();
            
            Response::json(200, true, "Listado de seguimientos", $results);
            
        } catch (\PDOException $e) {
            Response::json(500, false, "Error de base de datos al listar seguimientos: " . $e->getMessage());
        }
    }

    // 2. Obtener un seguimiento específico
    public function show($id) {
        $stmt = $this->db->prepare("SELECT * FROM trackings WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $tracking = $stmt->fetch();

        if (!$tracking) Response::json(404, false, "Seguimiento no encontrado");

        $stmtChild = $this->db->prepare("SELECT * FROM children WHERE id = :child_id");
        $stmtChild->execute([':child_id' => $tracking['child_id']]);
        $tracking['child'] = $stmtChild->fetch();

        $stmtM1 = $this->db->prepare("SELECT * FROM tracking_module1 WHERE tracking_id = :id");
        $stmtM1->execute([':id' => $id]);
        $tracking['module1'] = $stmtM1->fetch() ?: null;

        $stmtM2 = $this->db->prepare("SELECT * FROM tracking_module2 WHERE tracking_id = :id");
        $stmtM2->execute([':id' => $id]);
        $tracking['module2'] = $stmtM2->fetch() ?: null;

        $stmtM3 = $this->db->prepare("SELECT * FROM tracking_module3 WHERE tracking_id = :id");
        $stmtM3->execute([':id' => $id]);
        $tracking['module3'] = $stmtM3->fetch() ?: null;
        if ($tracking['module3']) {
            $stmtFamLog = $this->db->prepare("SELECT log_date, description FROM tracking_log_family WHERE tracking_id = :id ORDER BY log_date ASC");
            $stmtFamLog->execute([':id' => $id]);
            $tracking['module3']['family_logs'] = $stmtFamLog->fetchAll();
        }

        $stmtM4 = $this->db->prepare("SELECT * FROM tracking_module4 WHERE tracking_id = :id");
        $stmtM4->execute([':id' => $id]);
        $tracking['module4'] = $stmtM4->fetch() ?: null;
        if ($tracking['module4']) {
            $stmtAntro = $this->db->prepare("SELECT * FROM tracking_anthropometry WHERE tracking_id = :id ORDER BY take_number ASC");
            $stmtAntro->execute([':id' => $id]);
            $tracking['module4']['anthropometry'] = $stmtAntro->fetchAll();
        }

        $stmtM6 = $this->db->prepare("SELECT * FROM tracking_module6 WHERE tracking_id = :id");
        $stmtM6->execute([':id' => $id]);
        $tracking['module6'] = $stmtM6->fetch() ?: null;
        if ($tracking['module6']) {
            $stmtTalLog = $this->db->prepare("SELECT log_date, description FROM tracking_log_talent WHERE tracking_id = :id ORDER BY log_date ASC");
            $stmtTalLog->execute([':id' => $id]);
            $tracking['module6']['talent_logs'] = $stmtTalLog->fetchAll();
        }

        Response::json(200, true, "Detalle de seguimiento", $tracking);
    }

    // 3. Crear Seguimiento Maestro
    public function store($userData) {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->child_id)) {
            Response::json(400, false, "El ID del niño es obligatorio.");
        }

        try {
            // VALIDACIÓN REQ 2 y 4: Retiro y Unicidad Activa
            $stmtChild = $this->db->prepare("SELECT exit_date FROM children WHERE id = ?");
            $stmtChild->execute([$data->child_id]);
            $child = $stmtChild->fetch();
            
            $today = date('Y-m-d');

            if ($child && $child['exit_date'] && $child['exit_date'] < $today) {
                Response::json(400, false, "No se pueden agregar seguimientos de un niño que ya fue retirado.");
            }

            $stmtCheck = $this->db->prepare("SELECT id FROM trackings WHERE child_id = ?");
            $stmtCheck->execute([$data->child_id]);
            if ($stmtCheck->fetch() && empty($child['exit_date'])) {
                Response::json(400, false, "El niño ya tiene un seguimiento activo. Debe modificar el existente, no crear uno nuevo.");
            }

            $this->db->beginTransaction();

            $trackingCode = 'SEG-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
            $trackingDate = $today;
            $trackingTime = date('H:i:s');

            $stmt = $this->db->prepare("INSERT INTO trackings (tracking_code, child_id, created_by, tracking_date, tracking_time) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$trackingCode, $data->child_id, $userData['user_id'], $trackingDate, $trackingTime]);
            
            $trackingId = $this->db->lastInsertId();
            $modulesUserHas = $userData['modules'];

            // --- PROCESAR MÓDULO 1 ---
            if (isset($data->module1)) {
                if (!in_array('MODULO_1', $modulesUserHas)) throw new Exception("No tienes permiso para diligenciar el Módulo 1.");
                $m1 = $data->module1;
                $stmtM1 = $this->db->prepare("INSERT INTO tracking_module1 (tracking_id, ethnicity, has_disability, disability_type, medical_diagnosis, special_support, special_support_desc) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmtM1->execute([
                    $trackingId, $m1->ethnicity ?? 'Ninguna', $m1->has_disability ?? 0, 
                    $m1->disability_type ?? 'Ninguna', $m1->medical_diagnosis ?? 0, 
                    $m1->special_support ?? 0, $m1->special_support_desc ?? null
                ]);
            }

            // --- PROCESAR MÓDULO 2 ---
            if (isset($data->module2)) {
                if (!in_array('MODULO_2', $modulesUserHas)) throw new Exception("No tienes permiso para diligenciar el Módulo 2.");
                $m2 = $data->module2;
                $stmtM2 = $this->db->prepare("INSERT INTO tracking_module2 (tracking_id, participation, motivation, achievements, appropriate_strategies, strengthening_plan, explores_environment, interacts_material, health_behavior_news, absences, absences_reason, incidents, attention_routes, routes_desc, family_info, direct_observer, qualitative_scale, qualitative_no_reason, evaluates_dimensions, trimestral_val, advances, strengths_weaknesses, registers_results, qualitative_val) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmtM2->execute([
                    $trackingId, $m2->participation ?? 0, $m2->motivation ?? 0, $m2->achievements ?? null,
                    $m2->appropriate_strategies ?? 0, $m2->strengthening_plan ?? 0, $m2->explores_environment ?? 0,
                    $m2->interacts_material ?? 0, $m2->health_behavior_news ?? 0, $m2->absences ?? 0,
                    $m2->absences_reason ?? null, $m2->incidents ?? 0, $m2->attention_routes ?? 0,
                    $m2->routes_desc ?? null, $m2->family_info ?? 0, $m2->direct_observer ?? 0,
                    $m2->qualitative_scale ?? 0, $m2->qualitative_no_reason ?? null, $m2->evaluates_dimensions ?? 0,
                    $m2->trimestral_val ?? 0, $m2->advances ?? 0, $m2->strengths_weaknesses ?? 0,
                    $m2->registers_results ?? 0, $m2->qualitative_val ?? 'ESPERADO'
                ]);
            }

            // --- PROCESAR MÓDULO 3 CON LOGS ---
            if (isset($data->module3)) {
                if (!in_array('MODULO_3', $modulesUserHas)) throw new Exception("No tienes permiso para diligenciar el Módulo 3.");
                $m3 = $data->module3;
                $stmtM3 = $this->db->prepare("INSERT INTO tracking_module3 (tracking_id, risk_situations, rights_restoration, routes_articulation) VALUES (?, ?, ?, ?)");
                $stmtM3->execute([
                    $trackingId, $m3->risk_situations ?? 0, $m3->rights_restoration ?? 0, $m3->routes_articulation ?? 0
                ]);

                if (isset($m3->family_logs) && is_array($m3->family_logs)) {
                    $stmtFam = $this->db->prepare("INSERT INTO tracking_log_family (tracking_id, log_date, description) VALUES (?, ?, ?)");
                    foreach ($m3->family_logs as $log) {
                        if (!empty($log->log_date) && !empty($log->description)) {
                            $stmtFam->execute([$trackingId, $log->log_date, $log->description]);
                        }
                    }
                }
            }

            // --- PROCESAR MÓDULO 4 ---
            if (isset($data->module4)) {
                if (!in_array('MODULO_4', $modulesUserHas)) throw new Exception("No tienes permiso para diligenciar el Módulo 4.");
                $m4 = $data->module4;
                $stmtM4 = $this->db->prepare("INSERT INTO tracking_module4 (tracking_id, health_affiliated, regime, eps_name, vaccines_updated, growth_chart, controls_6_months, premature, gestational_age, breast_milk, exclusive_lactation_months, total_lactation_months, food_intro_age, oral_health_control, medical_assessment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
                $stmtM4->execute([
                    $trackingId, $m4->health_affiliated ?? 0, $m4->regime ?? 'Ninguno', $m4->eps_name ?? null, $m4->vaccines_updated ?? 0, $m4->growth_chart ?? 0, 
                    $this->num($m4->controls_6_months) ?? 0, $m4->premature ?? 0, $this->num($m4->gestational_age), $m4->breast_milk ?? 0, $this->num($m4->exclusive_lactation_months), 
                    $this->num($m4->total_lactation_months), $this->num($m4->food_intro_age), $m4->oral_health_control ?? 0, $m4->medical_assessment ?? 0
                ]);

                if (isset($m4->anthropometry) && is_array($m4->anthropometry)) {
                    $stmtAntro = $this->db->prepare("INSERT INTO tracking_anthropometry (tracking_id, take_number, weight_kg, height_cm, nutritional_classification) VALUES (?, ?, ?, ?, ?)");
                    foreach ($m4->anthropometry as $antro) {
                        $peso = $this->num($antro->weight_kg);
                        $talla = $this->num($antro->height_cm);
                        if ($peso === null && $talla === null) continue;
                        $stmtAntro->execute([$trackingId, $antro->take_number, $peso ?? 0, $talla ?? 0, $antro->nutritional_classification ?: 'No registra']);
                    }
                }
            }

            // --- PROCESAR MÓDULO 6 CON LOGS ---
            if (isset($data->module6)) {
                if (!in_array('MODULO_6', $modulesUserHas)) throw new Exception("No tienes permiso para diligenciar el Módulo 6.");
                $m6 = $data->module6;
                $stmtM6 = $this->db->prepare("INSERT INTO tracking_module6 (tracking_id) VALUES (?)");
                $stmtM6->execute([$trackingId]);

                if (isset($m6->talent_logs) && is_array($m6->talent_logs)) {
                    $stmtTalent = $this->db->prepare("INSERT INTO tracking_log_talent (tracking_id, log_date, description) VALUES (?, ?, ?)");
                    foreach ($m6->talent_logs as $log) {
                        if (!empty($log->log_date) && !empty($log->description)) {
                            $stmtTalent->execute([$trackingId, $log->log_date, $log->description]);
                        }
                    }
                }
            }

            $this->db->commit();
            Response::json(201, true, "Seguimiento guardado exitosamente.", ["tracking_code" => $trackingCode]);

        } catch (Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            Response::json(400, false, "Error al guardar: " . $e->getMessage());
        }
    }

    // 4. Actualizar Seguimiento Existente
    public function update($id, $userData) {
        $data = json_decode(file_get_contents("php://input"));
        $modulesUserHas = $userData['modules'];

        try {
            // VALIDACIÓN REQ 2: Retiro (Edición)
            $stmtChild = $this->db->prepare("SELECT c.exit_date FROM trackings t JOIN children c ON t.child_id = c.id WHERE t.id = ?");
            $stmtChild->execute([$id]);
            $child = $stmtChild->fetch();
            
            $today = date('Y-m-d');
            if ($child && $child['exit_date'] && $child['exit_date'] < $today) {
                Response::json(400, false, "No se pueden modificar seguimientos de un niño que ya fue retirado.");
            }

            $this->db->beginTransaction();

            $stmtCheck = $this->db->prepare("SELECT id FROM trackings WHERE id = :id");
            $stmtCheck->execute([':id' => $id]);
            if (!$stmtCheck->fetch()) throw new Exception("Seguimiento no encontrado.");

            // --- MÓDULO 1 ---
            if (isset($data->module1) && in_array('MODULO_1', $modulesUserHas)) {
                $m1 = $data->module1;
                $sqlM1 = "INSERT INTO tracking_module1 (tracking_id, ethnicity, has_disability, disability_type, medical_diagnosis, special_support, special_support_desc) 
                          VALUES (?, ?, ?, ?, ?, ?, ?) 
                          ON DUPLICATE KEY UPDATE ethnicity=VALUES(ethnicity), has_disability=VALUES(has_disability), disability_type=VALUES(disability_type), medical_diagnosis=VALUES(medical_diagnosis), special_support=VALUES(special_support), special_support_desc=VALUES(special_support_desc)";
                $stmtM1 = $this->db->prepare($sqlM1);
                $stmtM1->execute([$id, $m1->ethnicity, $m1->has_disability, $m1->disability_type, $m1->medical_diagnosis, $m1->special_support, $m1->special_support_desc]);
            }

            // --- MÓDULO 2 ---
            if (isset($data->module2) && in_array('MODULO_2', $modulesUserHas)) {
                $m2 = $data->module2;
                $sqlM2 = "INSERT INTO tracking_module2 (tracking_id, participation, motivation, achievements, appropriate_strategies, strengthening_plan, explores_environment, interacts_material, health_behavior_news, absences, absences_reason, incidents, attention_routes, routes_desc, family_info, direct_observer, qualitative_scale, qualitative_no_reason, evaluates_dimensions, trimestral_val, advances, strengths_weaknesses, registers_results, qualitative_val) 
                          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) 
                          ON DUPLICATE KEY UPDATE participation=VALUES(participation), motivation=VALUES(motivation), achievements=VALUES(achievements), appropriate_strategies=VALUES(appropriate_strategies), strengthening_plan=VALUES(strengthening_plan), explores_environment=VALUES(explores_environment), interacts_material=VALUES(interacts_material), health_behavior_news=VALUES(health_behavior_news), absences=VALUES(absences), absences_reason=VALUES(absences_reason), incidents=VALUES(incidents), attention_routes=VALUES(attention_routes), routes_desc=VALUES(routes_desc), family_info=VALUES(family_info), direct_observer=VALUES(direct_observer), qualitative_scale=VALUES(qualitative_scale), qualitative_no_reason=VALUES(qualitative_no_reason), evaluates_dimensions=VALUES(evaluates_dimensions), trimestral_val=VALUES(trimestral_val), advances=VALUES(advances), strengths_weaknesses=VALUES(strengths_weaknesses), registers_results=VALUES(registers_results), qualitative_val=VALUES(qualitative_val)";
                $stmtM2 = $this->db->prepare($sqlM2);
                $stmtM2->execute([$id, $m2->participation, $m2->motivation, $m2->achievements, $m2->appropriate_strategies, $m2->strengthening_plan, $m2->explores_environment, $m2->interacts_material, $m2->health_behavior_news, $m2->absences, $m2->absences_reason, $m2->incidents, $m2->attention_routes, $m2->routes_desc, $m2->family_info, $m2->direct_observer, $m2->qualitative_scale, $m2->qualitative_no_reason, $m2->evaluates_dimensions, $m2->trimestral_val, $m2->advances, $m2->strengths_weaknesses, $m2->registers_results, $m2->qualitative_val]);
            }

            // --- MÓDULO 3 CON LOGS ---
            if (isset($data->module3) && in_array('MODULO_3', $modulesUserHas)) {
                $m3 = $data->module3;
                $sqlM3 = "INSERT INTO tracking_module3 (tracking_id, risk_situations, rights_restoration, routes_articulation) 
                          VALUES (?, ?, ?, ?) 
                          ON DUPLICATE KEY UPDATE risk_situations=VALUES(risk_situations), rights_restoration=VALUES(rights_restoration), routes_articulation=VALUES(routes_articulation)";
                $stmtM3 = $this->db->prepare($sqlM3);
                $stmtM3->execute([$id, $m3->risk_situations, $m3->rights_restoration, $m3->routes_articulation]);

                $stmtDelFam = $this->db->prepare("DELETE FROM tracking_log_family WHERE tracking_id = ?");
                $stmtDelFam->execute([$id]);

                if (isset($m3->family_logs) && is_array($m3->family_logs)) {
                    $stmtFam = $this->db->prepare("INSERT INTO tracking_log_family (tracking_id, log_date, description) VALUES (?, ?, ?)");
                    foreach ($m3->family_logs as $log) {
                        if (!empty($log->log_date) && !empty($log->description)) {
                            $stmtFam->execute([$id, $log->log_date, $log->description]);
                        }
                    }
                }
            }

            // --- MÓDULO 4 ---
            if (isset($data->module4) && in_array('MODULO_4', $modulesUserHas)) {
                $m4 = $data->module4;
                $sqlM4 = "INSERT INTO tracking_module4 (tracking_id, health_affiliated, regime, eps_name, vaccines_updated, growth_chart, controls_6_months, premature, gestational_age, breast_milk, exclusive_lactation_months, total_lactation_months, food_intro_age, oral_health_control, medical_assessment) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                          ON DUPLICATE KEY UPDATE health_affiliated=VALUES(health_affiliated), regime=VALUES(regime), eps_name=VALUES(eps_name), vaccines_updated=VALUES(vaccines_updated), growth_chart=VALUES(growth_chart), controls_6_months=VALUES(controls_6_months), premature=VALUES(premature), gestational_age=VALUES(gestational_age), breast_milk=VALUES(breast_milk), exclusive_lactation_months=VALUES(exclusive_lactation_months), total_lactation_months=VALUES(total_lactation_months), food_intro_age=VALUES(food_intro_age), oral_health_control=VALUES(oral_health_control), medical_assessment=VALUES(medical_assessment)";
                $stmtM4 = $this->db->prepare($sqlM4);
                $stmtM4->execute([
                    $id, $m4->health_affiliated, $m4->regime, $m4->eps_name, $m4->vaccines_updated, $m4->growth_chart, 
                    $this->num($m4->controls_6_months) ?? 0, $m4->premature, $this->num($m4->gestational_age), $m4->breast_milk, $this->num($m4->exclusive_lactation_months), 
                    $this->num($m4->total_lactation_months), $this->num($m4->food_intro_age), $m4->oral_health_control, $m4->medical_assessment
                ]);

                $stmtDelAntro = $this->db->prepare("DELETE FROM tracking_anthropometry WHERE tracking_id = ?");
                $stmtDelAntro->execute([$id]);

                if (isset($m4->anthropometry) && is_array($m4->anthropometry)) {
                    $stmtAntro = $this->db->prepare("INSERT INTO tracking_anthropometry (tracking_id, take_number, weight_kg, height_cm, nutritional_classification) VALUES (?, ?, ?, ?, ?)");
                    foreach ($m4->anthropometry as $antro) {
                        $peso = $this->num($antro->weight_kg);
                        $talla = $this->num($antro->height_cm);
                        if ($peso === null && $talla === null) continue;
                        $stmtAntro->execute([$id, $antro->take_number, $peso ?? 0, $talla ?? 0, $antro->nutritional_classification ?: 'No registra']);
                    }
                }
            }

            // --- MÓDULO 6 CON LOGS ---
            if (isset($data->module6) && in_array('MODULO_6', $modulesUserHas)) {
                $m6 = $data->module6;
                $sqlM6 = "INSERT INTO tracking_module6 (tracking_id) 
                          VALUES (?) 
                          ON DUPLICATE KEY UPDATE tracking_id=VALUES(tracking_id)";
                $stmtM6 = $this->db->prepare($sqlM6);
                $stmtM6->execute([$id]);

                $stmtDelTalent = $this->db->prepare("DELETE FROM tracking_log_talent WHERE tracking_id = ?");
                $stmtDelTalent->execute([$id]);

                if (isset($m6->talent_logs) && is_array($m6->talent_logs)) {
                    $stmtTalent = $this->db->prepare("INSERT INTO tracking_log_talent (tracking_id, log_date, description) VALUES (?, ?, ?)");
                    foreach ($m6->talent_logs as $log) {
                        if (!empty($log->log_date) && !empty($log->description)) {
                            $stmtTalent->execute([$id, $log->log_date, $log->description]);
                        }
                    }
                }
            }

            $this->db->commit();
            Response::json(200, true, "Seguimiento actualizado exitosamente.");

        } catch (Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            Response::json(400, false, "Error al actualizar: " . $e->getMessage());
        }
    }

    public function statistics() {
        $stats = [];
        $stats['total_children'] = $this->db->query("SELECT COUNT(id) FROM children")->fetchColumn();
        $stats['total_trackings'] = $this->db->query("SELECT COUNT(id) FROM trackings")->fetchColumn();
        $stats['children_by_facility'] = $this->db->query("SELECT facility, COUNT(*) as count FROM children GROUP BY facility")->fetchAll();
        $stats['development_status'] = $this->db->query("SELECT qualitative_val, COUNT(*) as count FROM tracking_module2 GROUP BY qualitative_val")->fetchAll();
        $stats['rights_risks'] = $this->db->query("SELECT SUM(risk_situations) as risk_total, SUM(rights_restoration) as restoration_total FROM tracking_module3")->fetch();
        $stats['health_stats'] = $this->db->query("SELECT SUM(vaccines_updated) as vaccines_ok, SUM(health_affiliated) as affiliated_ok FROM tracking_module4")->fetch();

        Response::json(200, true, "Estadísticas cargadas", $stats);
    }
}