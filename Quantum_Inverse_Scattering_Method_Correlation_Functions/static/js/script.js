// Récupérer le paramètre 'file' de l'URL
// const urlParams = new URLSearchParams(window.location.search);
// const file = urlParams.get('file');

// Vérification du fichier PDF
if (!file) {
    alert('Aucun fichier PDF spécifié.');
    throw new Error('Aucun fichier PDF spécifié.');
}

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const scale = 1.5;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const pdfRenderDiv = document.getElementById('pdf-render');

// Ajouter le canvas au div pour le rendu
pdfRenderDiv.appendChild(canvas);

// Fonction pour afficher la page
const renderPage = num => {
    pageIsRendering = true;

    // Obtenir la page à partir du document PDF
    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderCtx = {
            canvasContext: ctx,
            viewport
        };

        // Rendre la page sur le canvas
        page.render(renderCtx).promise.then(() => {
            pageIsRendering = false;

            // Si une autre page est en attente, la rendre
            if (pageNumIsPending !== null) {
                renderPage(pageNumIsPending);
                pageNumIsPending = null;
            }
        });

        // Afficher le numéro de page actuel
        document.getElementById('page-num').textContent = num;
    }).catch(error => {
        console.error(`Erreur lors du rendu de la page ${num}:`, error);
    });
};

// Fonction pour vérifier et rendre la page suivante/pending
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumIsPending = num; // Mettez en attente le rendu de la page
    } else {
        renderPage(num); // Rendre la page directement
    }
};

// Charger le document PDF
pdfjsLib.getDocument(file).promise.then(pdfDoc_ => {
    pdfDoc = pdfDoc_;
    document.getElementById('page-count').textContent = pdfDoc.numPages;

    // Afficher la première page
    renderPage(pageNum);
}).catch(error => {
    console.error('Erreur lors du chargement du fichier PDF:', error);
    alert('Impossible de charger le document PDF. Veuillez vérifier le chemin du fichier.');
});

// Événement pour la page précédente
document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum > 1) {
        pageNum--; // Décrémentez le numéro de page
        queueRenderPage(pageNum); // Rendre la nouvelle page
    }
});

// Événement pour la page suivante
document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum < pdfDoc.numPages) {
        pageNum++; // Incrémentez le numéro de page
        queueRenderPage(pageNum); // Rendre la nouvelle page
    }
});
