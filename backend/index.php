<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

require_once 'middlewares/AuthMiddleware.php';
require_once 'controllers/AuthController.php';
require_once 'controllers/UserController.php';
require_once 'controllers/RoleController.php';
require_once 'controllers/ChildController.php';
require_once 'controllers/TrackingController.php';
require_once 'controllers/ReportController.php'; 
require_once 'utils/Response.php';

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$route = str_replace($scriptName, '', $request_uri);
$route = trim($route, '/');

// Parsear ruta en partes (Ej: "users/5" -> [0]=>"users", [1]=>"5")
$routeParts = explode('/', $route);
$resource = $routeParts[0] ?? '';
$id = $routeParts[1] ?? null;

$authController = new AuthController();
$userController = new UserController();
$roleController = new RoleController();
$childController = new ChildController();
$trackingController = new TrackingController();
$reportController = new ReportController();

switch ($resource) {
    // ---- RUTAS PÚBLICAS ----
    case 'login':
        if ($method == 'POST') $authController->login();
        break;
    case 'forgot-password':
        if ($method == 'POST') $authController->forgotPassword();
        break;
    case 'reset-password':
        if ($method == 'POST') $authController->resetPassword();
        break;

    // ---- SEGUIMIENTOS Y ESTADÍSTICAS (Nuevo) ----
    case 'trackings':
        // Verificamos que el token sea válido (Cualquier usuario con sesión puede entrar aquí, 
        // pero el controlador valida si tiene el módulo específico para guardar)
        $userData = AuthMiddleware::verify(); 

        if ($method == 'GET' && $id === 'statistics') {
            $trackingController->statistics();
        } 
        elseif ($method == 'GET' && $id) {
            $trackingController->show($id);
        } 
        elseif ($method == 'GET') {
            $trackingController->index();
        } 
        elseif ($method == 'POST') {
            // Le pasamos la información del usuario para que sepa quién lo crea y qué módulos tiene
            $trackingController->store($userData);
        }
        elseif ($method == 'PUT' && $id) {
            $trackingController->update($id, $userData);
        }
        break;

    // ---- GESTIÓN DE NIÑOS ----
    case 'children':
        // Si es una petición GET (Listar), solo pedimos que el usuario esté logueado
        if ($method == 'GET' && !$id) {
            AuthMiddleware::verify(); // Cualquier rol con sesión entra
            $childController->index();
        } 
        // Para todo lo demás (Crear, Editar, Borrar, Importar, Plantilla), 
        // exigimos estrictamente el permiso GESTION_NINOS
        else {
            AuthMiddleware::verify('GESTION_NINOS');
            
            if ($id === 'template' && $method == 'GET') {
                $childController->downloadTemplate();
            } elseif ($id === 'import' && $method == 'POST') {
                $childController->importExcel();
            } elseif ($method == 'POST') {
                $childController->store();
            } elseif ($method == 'PUT' && $id) {
                $childController->update($id);
            } elseif ($method == 'DELETE' && $id) {
                $childController->destroy($id);
            }
        }
        break;

    // ---- ADMINISTRACIÓN ----
    case 'users':
        AuthMiddleware::verify('ADMINISTRACION');
        if ($method == 'GET') $userController->index();
        elseif ($method == 'POST') $userController->store();
        elseif ($method == 'PUT' && $id) $userController->update($id);
        elseif ($method == 'DELETE' && $id) $userController->destroy($id);
        break;

    case 'roles':
        AuthMiddleware::verify('ADMINISTRACION');
        if ($method == 'GET') $roleController->index();
        elseif ($method == 'POST') $roleController->store();
        elseif ($method == 'PUT' && $id) $roleController->update($id);
        break;

    case 'modules':
        AuthMiddleware::verify('ADMINISTRACION');
        if ($method == 'GET') $roleController->getModules();
        break;

    case 'ping':
        Response::json(200, true, "API funcionando OK");
        break;

    default:
        Response::json(404, false, "Endpoint no encontrado: " . $resource);
        break;

    // ---- REPORTES GERENCIALES DETALLADOS ----
    case 'reports':
        // Solo usuarios con el rol configurado pueden ver esto
        AuthMiddleware::verify('REPORTES'); 
        
        if ($method == 'GET') {
            if ($id === 'nutritional') $reportController->getNutritionalRisk();
            elseif ($id === 'pedagogical') $reportController->getPedagogicalRisk();
            elseif ($id === 'family') $reportController->getFamilyAlerts();
            elseif ($id === 'health') $reportController->getHealthAlerts();
            else Response::json(400, false, "Reporte no válido");
        }
        break;
}