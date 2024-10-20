const { execSync } = require('child_process');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Vérifie si Node.js est initialisé
try {
    execSync('npm init -y', { stdio: 'ignore' });
    console.log('Projet Node.js initialisé.');
} catch (error) {
    console.log('Le projet Node.js est déjà initialisé ou une erreur est survenue.');
}

// Installe Express si ce n'est pas déjà fait
try {
    execSync('npm install express', { stdio: 'ignore' });
    console.log('Express installé.');
} catch (error) {
    console.log('Express est déjà installé ou une erreur est survenue.');
}

const app = express();
const PORT = 3000;

// Middleware pour servir des fichiers statiques
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Création des dossiers si non existants
const texDir = path.join(__dirname, 'tex_files');
const pdfDir = path.join(__dirname, 'pdf_files');

if (!fs.existsSync(texDir)) {
    fs.mkdirSync(texDir);
}

if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
}

// Route pour compiler le fichier LaTeX
app.post('/compile', (req, res) => {
    const texFileName = req.body.texFileName;
    const texFilePath = path.join(texDir, texFileName); // Chemin vers le fichier .tex

    // Exécuter pdflatex dans le terminal
    execSync(`pdflatex -interaction=nonstopmode -output-directory=${pdfDir} ${texFilePath}`, { stdio: 'inherit' });

    const pdfFileName = texFileName.replace('.tex', '.pdf');
    const pdfFilePath = path.join(pdfDir, pdfFileName);

    // Vérifie si le fichier PDF a été créé
    if (fs.existsSync(pdfFilePath)) {
        res.download(pdfFilePath, pdfFileName); // Renvoie le PDF pour téléchargement
    } else {
        res.status(500).send('Le fichier PDF n\'a pas été créé');
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

// Page HTML intégrée
const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compilateur LaTeX</title>
</head>
<body>
    <h1>Compilateur LaTeX</h1>
    <form id="compile-form">
        <label for="texFileName">Nom du fichier .tex :</label>
        <input type="text" id="texFileName" name="texFileName" required>
        <button type="submit">Compiler</button>
    </form>

    <script>
        document.getElementById('compile-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const texFileName = document.getElementById('texFileName').value;

            const response = await fetch('/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ texFileName }),
            });

            if (response.ok) {
                // Le PDF sera téléchargé automatiquement
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = texFileName.replace('.tex', '.pdf');
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Erreur lors de la compilation.');
            }
        });
    </script>
</body>
</html>
`;

// Route pour servir la page HTML
app.get('/', (req, res) => {
    res.send(htmlContent);
});
