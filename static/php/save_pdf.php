

<?php
// Spécifiez le nom du fichier JSON
$file = '../json/data.json';

// Récupérer les données JSON envoyées par le JavaScript
$json = file_get_contents('php://input');
error_log("Données reçues: " . $json); // Enregistrer les données dans le log

// Décoder le JSON en tableau associatif
$data = json_decode($json, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("Erreur de décodage JSON: " . json_last_error_msg()); // Log de l'erreur
}

// Enregistrer les données dans un fichier
if (file_put_contents($file, json_encode($data))) {
    // Réponse JSON pour indiquer le succès
    echo json_encode(['status' => 'success']);
} else {
    // Réponse JSON pour indiquer l'échec
    echo json_encode(['status' => 'error']);
}



?>


