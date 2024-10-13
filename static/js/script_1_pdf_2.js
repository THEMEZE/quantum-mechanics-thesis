(function() {
    // Variables pour le PDF
    let pdfDoc = null,
        pageNum = 1,
        pageIsRendering = false,
        pageNumIsPending = null;

    const scale = 1.5,
          canvas = document.getElementById('pdf-canvas'), // Utilisation de l'ID correct du canvas
          ctx = canvas.getContext('2d');

    // Fonction pour charger le PDF basé sur la sélection
    const loadPDF = () => {
        const file = document.getElementById('file').value; // Récupère la valeur sélectionnée
        pageNum = 1; // Remet à 1 le numéro de page lors du chargement d'un nouveau fichier
        pdfjsLib.getDocument(file).promise.then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            document.getElementById('page-count').textContent = pdfDoc.numPages; // Affiche le nombre total de pages
            renderPage(pageNum);
        }).catch(error => {
            console.error('Erreur lors du chargement du fichier PDF:', error);
        });
    };

    // Event listener pour charger le fichier quand on clique sur le bouton
    document.getElementById('load-file').addEventListener('click', loadPDF);

    // Afficher la page du PDF
    const renderPage = num => {
        pageIsRendering = true;
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderCtx = {
                canvasContext: ctx,
                viewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering = false;

                // Si une page est en attente, on la rend après la page actuelle
                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
            });

            // Mise à jour du numéro de page affiché
            document.getElementById('page-num').value = num;
        }).catch(error => {
            console.error('Erreur lors de la récupération de la page:', error);
        });
    };

    // Gestion des boutons pour changer de page
    document.getElementById('prev-page').addEventListener('click', () => {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++; // Correction ici : 'pageNum1' devient 'pageNum'
        queueRenderPage(pageNum);
    });

    // Gestion de l'input pour changer directement de page
    document.getElementById('page-num').addEventListener('change', (event) => {
        const inputPageNum = Number(event.target.value);
        if (inputPageNum >= 1 && inputPageNum <= pdfDoc.numPages) {
            pageNum = inputPageNum;
            queueRenderPage(pageNum);
        } else {
            event.target.value = pageNum; // Réinitialise l'input à la page actuelle si l'entrée est invalide
        }
    });

    // Mise en file d'attente du rendu de la page si une autre page est en cours de rendu
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }
    };

    // Charger un PDF par défaut au démarrage
    window.addEventListener('load', () => {
        loadPDF(); // Charger automatiquement le PDF au démarrage
    });
})();