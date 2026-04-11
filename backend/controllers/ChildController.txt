<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

// Importamos las clases necesarias de PhpSpreadsheet
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ChildController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function index() {
        try {
            $sql = "SELECT *, TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age 
                    FROM children ORDER BY surnames ASC, names ASC";
            $stmt = $this->db->query($sql);
            Response::json(200, true, "Lista de niños", $stmt->fetchAll());
        } catch (\Exception $e) {
            Response::json(500, false, "Error al listar: " . $e->getMessage());
        }
    }

    public function downloadTemplate() {
        try {
            if (ob_get_contents()) ob_end_clean(); // Limpiar basura del buffer

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            $headers = [
                'A1' => 'Nombres', 'B1' => 'Apellidos', 'C1' => 'Registro Civil', 
                'D1' => 'Fecha Nacimiento (YYYY-MM-DD)', 'E1' => 'Fecha Ingreso (YYYY-MM-DD)', 
                'F1' => 'Sexo (Masculino/Femenino)', 'G1' => 'Grupo Sanguíneo', 
                'H1' => 'RH (+/-)', 'I1' => 'EPS', 'J1' => 'Dirección', 'K1' => 'Sede', 
                'L1' => 'Parentesco', 'M1' => 'Nombre Acudiente', 
                'N1' => 'Documento Acudiente', 'O1' => 'Dirección Acudiente', 'P1' => 'Celular Acudiente'
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }

            foreach (range('A', 'P') as $col) { $sheet->getColumnDimension($col)->setAutoSize(true); }

            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment;filename="Plantilla_Importacion.xlsx"');
            header('Cache-Control: max-age=0');

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            exit;
        } catch (\Exception $e) {
            die("Error generando plantilla: " . $e->getMessage());
        }
    }

    public function importExcel() {
        if (!isset($_FILES['file'])) {
            Response::json(400, false, "No se recibió el archivo.");
        }

        error_reporting(0);
        ini_set('display_errors', 0);

        $fileTmpPath = $_FILES['file']['tmp_name'];
        
        try {
            $spreadsheet = IOFactory::load($fileTmpPath);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
            
            array_shift($rows); 

            $successCount = 0;
            $errorCount = 0;
            $firstErrorMessage = ""; 

            $this->db->beginTransaction();

            $stmtInsert = $this->db->prepare("INSERT INTO children 
                (names, surnames, civil_registry, birth_date, entry_date, gender, blood_group, rh, eps, address, facility, guardian_relation, guardian_name, guardian_document, guardian_address, guardian_phone) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($rows as $index => $row) {
                if (empty($row[0]) && empty($row[2])) continue;

                // --- PROCESAMIENTO INTELIGENTE DE DATOS ---
                $data = [
                    $this->clean($row[0]),  // names
                    $this->clean($row[1]),  // surnames
                    $this->clean($row[2]),  // civil_registry
                    $this->formatExcelDate($row[3]), // birth_date
                    $this->formatExcelDate($row[4]), // entry_date
                    $this->sanitizeGender($row[5]),  // SEXO: Convierte M/F/Hombre a Masculino/Femenino
                    $this->clean($row[6]),           // blood_group
                    $this->sanitizeRh($row[7]),      // RH: Extrae solo el + o -
                    $this->clean($row[8]),           // eps
                    $this->clean($row[9]),           // address
                    $this->clean($row[10]),          // facility
                    $this->sanitizeRelation($row[11]),// PARENTESCO: Madre/Padre/Otro
                    $this->clean($row[12]),          // guardian_name
                    $this->clean($row[13]),          // guardian_document
                    $this->clean($row[14]),          // guardian_address
                    $this->clean($row[15])           // guardian_phone
                ];

                try {
                    $stmtInsert->execute($data);
                    $successCount++;
                } catch (\PDOException $e) {
                    $errorCount++;
                    if (empty($firstErrorMessage)) {
                        $firstErrorMessage = "Error en fila " . ($index + 2) . ": " . $e->getMessage();
                    }
                }
            }

            $this->db->commit();
            
            $msg = "Importación finalizada. Registrados: $successCount. Omitidos: $errorCount.";
            if ($successCount === 0 && $errorCount > 0) {
                $msg .= " Detalle: " . $firstErrorMessage;
            }

            Response::json(200, true, $msg);

        } catch (\Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            Response::json(500, false, "Error de sistema: " . $e->getMessage());
        }
    }


    private function formatExcelDate($value) {
        if (empty($value)) return date('Y-m-d'); // Fecha hoy por defecto si está vacío
        
        try {
            if (is_numeric($value)) {
                return Date::excelToDateTimeObject($value)->format('Y-m-d');
            }
            // Intentar convertir texto a fecha
            $date = strtotime(str_replace('/', '-', $value));
            return $date ? date('Y-m-d', $date) : date('Y-m-d');
        } catch (\Exception $e) {
            return date('Y-m-d');
        }
    }

    public function destroy($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM children WHERE id = :id");
            $stmt->execute([':id' => $id]);
            Response::json(200, true, "Niño eliminado.");
        } catch (\Exception $e) {
            Response::json(500, false, "Error al eliminar.");
        }
    }

    private function sanitizeRh($value) {
        $val = trim((string)$value);
        if (str_contains($val, '+')) return '+';
        if (str_contains($val, '-')) return '-';
        return '+'; // Valor por defecto para evitar error
    }

    private function sanitizeGender($value) {
        $val = strtolower(trim((string)$value));
        if (str_starts_with($val, 'm')) return 'Masculino';
        if (str_starts_with($val, 'f')) return 'Femenino';
        return 'Masculino'; // Valor por defecto
    }

    private function sanitizeRelation($value) {
        $val = strtolower(trim((string)$value));
        if (str_contains($val, 'madre')) return 'Madre';
        if (str_contains($val, 'padre')) return 'Padre';
        return 'Otro';
    }

    private function clean($value) {
        if ($value === null) return '';
        return trim((string)$value);
    }
}