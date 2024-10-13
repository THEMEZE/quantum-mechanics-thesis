(function() {
    // Variables pour le premier PDF
    let pdfDoc1 = null,
        pageNum1 = 1,
        pageIsRendering1 = false,
        pageNumIsPending1 = null;

    // Variables pour le second PDF
    let pdfDoc2 = null,
        pageNum2 = 1,
        pageIsRendering2 = false,
        pageNumIsPending2 = null;

    const scale = 1.5,
          canvas1 = document.getElementById('canvas-1'),
          ctx1 = canvas1.getContext('2d'),
          canvas2 = document.getElementById('canvas-2'),
          ctx2 = canvas2.getContext('2d');

    // Fonction pour charger le premier PDF basé sur la sélection
    const loadPDF1 = () => {
        const file1 = document.getElementById('file1').value; // Récupère la valeur sélectionnée
        pageNum1 = 1; // Remet à 1 le numéro de page lors du chargement d'un nouveau fichier
        pdfjsLib.getDocument(file1).promise.then(pdfDoc_ => {
            pdfDoc1 = pdfDoc_;
            document.getElementById('page-count-1').textContent = pdfDoc1.numPages;
            renderPage1(pageNum1);
        }).catch(error => {
            console.error('Erreur lors du chargement du premier fichier PDF:', error);
        });
    };

    // Fonction pour charger le second PDF basé sur la sélection
    const loadPDF2 = () => {
        const file2 = document.getElementById('file2').value; // Récupère la valeur sélectionnée
        pageNum2 = 1; // Remet à 1 le numéro de page lors du chargement d'un nouveau fichier
        pdfjsLib.getDocument(file2).promise.then(pdfDoc_ => {
            pdfDoc2 = pdfDoc_;
            document.getElementById('page-count-2').textContent = pdfDoc2.numPages;
            renderPage2(pageNum2);
        }).catch(error => {
            console.error('Erreur lors du chargement du second fichier PDF:', error);
        });
    };

    // Appeler les fonctions pour charger automatiquement un fichier au démarrage
    window.addEventListener('load', () => {
        loadPDF1(); // Charger automatiquement le PDF 1 à la page de chargement
        loadPDF2(); // Charger automatiquement le PDF 2 à la page de chargement
    });

    // Event listeners pour charger les fichiers quand on clique sur les boutons
    document.getElementById('load-file-1').addEventListener('click', loadPDF1);
    document.getElementById('load-file-2').addEventListener('click', loadPDF2);

    // Afficher la page du premier PDF
    const renderPage1 = num => {
        pageIsRendering1 = true;
        pdfDoc1.getPage(num).then(page => {
            const viewport = page.getViewport({ scale });
            canvas1.height = viewport.height;
            canvas1.width = viewport.width;

            const renderCtx = {
                canvasContext: ctx1,
                viewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering1 = false;

                if (pageNumIsPending1 !== null) {
                    renderPage1(pageNumIsPending1);
                    pageNumIsPending1 = null;
                }
            });

            document.getElementById('page-num-1').value = num;
        });
    };

    // Afficher la page du second PDF
    const renderPage2 = num => {
        pageIsRendering2 = true;
        pdfDoc2.getPage(num).then(page => {
            const viewport = page.getViewport({ scale });
            canvas2.height = viewport.height;
            canvas2.width = viewport.width;

            const renderCtx = {
                canvasContext: ctx2,
                viewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering2 = false;

                if (pageNumIsPending2 !== null) {
                    renderPage2(pageNumIsPending2);
                    pageNumIsPending2 = null;
                }
            });

            document.getElementById('page-num-2').value = num;
        });
    };

    // Gestion des boutons pour le premier PDF
    document.getElementById('prev-page-1').addEventListener('click', () => {
        if (pageNum1 <= 1) {
            return;
        }
        pageNum1--;
        queueRenderPage1(pageNum1);
    });

    document.getElementById('next-page-1').addEventListener('click', () => {
        if (pageNum1 >= pdfDoc1.numPages) {
            return;
        }
        pageNum1++;
        queueRenderPage1(pageNum1);
    });

    // Gestion de l'input pour le premier PDF
    document.getElementById('page-num-1').addEventListener('change', (event) => {
        const inputPageNum = Number(event.target.value);
        if (inputPageNum >= 1 && inputPageNum <= pdfDoc1.numPages) {
            pageNum1 = inputPageNum;
            queueRenderPage1(pageNum1);
        } else {
            event.target.value = pageNum1;
        }
    });

    const queueRenderPage1 = num => {
        if (pageIsRendering1) {
            pageNumIsPending1 = num;
        } else {
            renderPage1(num);
        }
    };

    // Gestion des boutons pour le second PDF
    document.getElementById('prev-page-2').addEventListener('click', () => {
        if (pageNum2 <= 1) {
            return;
        }
        pageNum2--;
        queueRenderPage2(pageNum2);
    });

    document.getElementById('next-page-2').addEventListener('click', () => {
        if (pageNum2 >= pdfDoc2.numPages) {
            return;
        }
        pageNum2++;
        queueRenderPage2(pageNum2);
    });

    // Gestion de l'input pour le second PDF
    document.getElementById('page-num-2').addEventListener('change', (event) => {
        const inputPageNum = Number(event.target.value);
        if (inputPageNum >= 1 && inputPageNum <= pdfDoc2.numPages) {
            pageNum2 = inputPageNum;
            queueRenderPage2(pageNum2);
        } else {
            event.target.value = pageNum2;
        }
    });

    const queueRenderPage2 = num => {
        if (pageIsRendering2) {
            pageNumIsPending2 = num;
        } else {
            renderPage2(num);
        }
    };
})();

document.querySelector('.npage-file-1').addEventListener('click', (e) => {
    e.preventDefault(); // Empêche le comportement par défaut du bouton

    // Récupérer le fichier sélectionné
    const selectedFile = document.querySelector('.file1').value;

    // Mettre à jour le href du lien
    const link = document.getElementById('npage-file-1');
    link.href = selectedFile;

    // Ouvrir le PDF sélectionné dans un nouvel onglet
    window.open(selectedFile, '_blank'); 
});


document.querySelector('.npage-file-2').addEventListener('click', (e) => {
    e.preventDefault(); // Empêche le comportement par défaut du bouton

    // Récupérer le fichier sélectionné
    const selectedFile = document.querySelector('.file2').value;

    // Mettre à jour le href du lien
    const link = document.getElementById('npage-file-2');
    link.href = selectedFile;

    // Ouvrir le PDF sélectionné dans un nouvel onglet
    window.open(selectedFile, '_blank'); 
});


