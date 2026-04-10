<?php
require_once 'config/database.php';

try {
    $db = Database::getConnection();
    
    // Generamos el hash criptográfico real para Admin123!
    $hashReal = password_hash('Admin123!', PASSWORD_BCRYPT);
    
    // Lo actualizamos en la base de datos
    $stmt = $db->prepare("UPDATE users SET password = :hash WHERE email = 'admin@hogarinfantil.com'");
    $stmt->execute([':hash' => $hashReal]);
    
    echo "<h1>¡Éxito!</h1>";
    echo "<p>Contraseña actualizada correctamente. Ya puedes ir a React e iniciar sesión con <b>Admin123!</b></p>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}