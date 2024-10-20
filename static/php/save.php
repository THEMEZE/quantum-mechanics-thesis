<?php
// Récupérer les données POST
$data = json_decode(file_get_contents('php://input'), true);
$fileContent = $data['fileContent'];
$filePath = $data['filePath'];

// Vérifier si le fichier existe
if (file_exists($filePath)) {
    // Sauvegarder le fichier avec le contenu modifié
    if (file_put_contents($filePath, $fileContent)) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Échec de la sauvegarde.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Fichier non trouvé.']);
}
?>
