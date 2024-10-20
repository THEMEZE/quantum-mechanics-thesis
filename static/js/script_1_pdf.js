(function() {
    // Variables pour le PDF
    let pdfDoc = null,
        pageNum = 1,
        pageIsRendering = false,
        pageNumIsPending = null;

    const scale = 1.5,
          canvas = document.getElementById('pdf-canvas'),
          ctx = canvas.getContext('2d');

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

                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
            });

            document.getElementById('page-num').value = num; // Mettre à jour la valeur de l'input
        });
    };

    // Charger le document PDF
    // const file = './These_Memoire.pdf';  // URL de ton PDF
    pdfjsLib.getDocument(file).promise.then(pdfDoc_ => {
        pdfDoc = pdfDoc_;
        document.getElementById('page-count').textContent = pdfDoc.numPages;
        renderPage(pageNum);
    }).catch(error => {
        console.error('Erreur lors du chargement du fichier PDF:', error);
    });

    // Gestion des boutons pour la navigation
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
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Gestion de l'input pour le numéro de page
    document.getElementById('page-num').addEventListener('change', (event) => {
        const inputPageNum = Number(event.target.value);
        if (inputPageNum >= 1 && inputPageNum <= pdfDoc.numPages) {
            pageNum = inputPageNum;
            queueRenderPage(pageNum);
        } else {
            event.target.value = pageNum; // Réinitialiser si la valeur n'est pas valide
        }
    });

    // Queue pour le rendu de la page du PDF
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }
    };
  })(); // Fin de l'IIFE