#!/usr/bin/env bash
set -euo pipefail

# ======================
# Config
# ======================
# Seuil principal (suppressions de l'index) en octets (50MB)
THRESHOLD_BYTES=$((50 * 1024 * 1024))

# Optionnel: mettre en LFS les fichiers entre LFS_MIN et LFS_MAX (en octets)
LFS_MIN_BYTES=$((1 * 1024 * 1024))    # min size to consider for LFS (ex: 1MB)
LFS_MAX_BYTES=$((100 * 1024 * 1024))  # max GitHub accepte en LFS (100MB)

DRY_RUN=true    # true = affichage seulement
GIT_PUSH=true   # true = push à la fin si commit effectué

# ======================
# Helpers
# ======================
filesize() {
    # renvoie la taille en octets d'un fichier portable (macOS/Linux)
    local f="$1"
    if stat --version >/dev/null 2>&1; then
        # GNU stat (Linux)
        stat -c%s -- "$f"
    else
        # BSD stat (macOS)
        stat -f%z -- "$f"
    fi
}

usage() {
    cat <<EOF
Usage: $0 [--apply] [--no-push] [--threshold MB]

Options:
  --apply           : exécute réellement les suppressions (par défaut --dry-run)
  --no-push         : n'effectue pas de git push après commit
  --threshold MB    : seuil en MB (défaut 50)
  --help
EOF
    exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --apply) DRY_RUN=false; shift ;;
        --no-push) GIT_PUSH=false; shift ;;
        --threshold)
            shift
            if [[ -z "${1:-}" ]]; then usage; fi
            THRESHOLD_BYTES=$(( $1 * 1024 * 1024 ))
            shift
            ;;
        --help) usage ;;
        *) echo "Unknown arg: $1"; usage ;;
    esac
done

echo "=== Script cleanup_large_files ==="
echo "Seuil suppression index : $((THRESHOLD_BYTES/1024/1024)) MB"
echo "Dry run : $DRY_RUN"
echo "Push après commit : $GIT_PUSH"
echo

# ======================
# Vérifications
# ======================
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Erreur: tu dois lancer ce script depuis la racine d'un repo git."
    exit 2
fi

# Vérifier si git lfs est installé (pour la partie LFS)
if command -v git-lfs >/dev/null 2>&1 || git lfs version >/dev/null 2>&1; then
    HAS_GIT_LFS=true
else
    HAS_GIT_LFS=false
fi

# ======================
# Recherche des fichiers suivis dépassant le seuil
# ======================
echo "Recherche des fichiers suivis par Git dont la taille > seuil..."
TO_REMOVE=()
TO_LFS=()

# On parcourt les fichiers suivis (git ls-files -z gère noms spéciaux)
git ls-files -z | while IFS= read -r -d '' file; do
    # Ignore si le fichier n'existe plus localement
    if [[ ! -f "$file" ]]; then
        continue
    fi

    size=$(filesize "$file" || echo 0)
    if (( size >= THRESHOLD_BYTES )); then
        TO_REMOVE+=("$file")
    elif (( size >= LFS_MIN_BYTES && size <= LFS_MAX_BYTES )); then
        TO_LFS+=("$file")
    fi
done

# Note: array population above happens in a subshell due to pipe; so rebuild arrays differently
# Alternative: use temporary file to collect
TMPFILE=$(mktemp)
git ls-files -z | while IFS= read -r -d '' file; do
    if [[ -f "$file" ]]; then
        sz=$(filesize "$file" || echo 0)
        printf '%s\t%s\n' "$sz" "$file" >> "$TMPFILE"
    fi
done

TO_REMOVE=()
TO_LFS=()
while IFS=$'\t' read -r sz file; do
    if (( sz >= THRESHOLD_BYTES )); then
        TO_REMOVE+=("$file")
    elif (( sz >= LFS_MIN_BYTES && sz <= LFS_MAX_BYTES )); then
        TO_LFS+=("$file")
    fi
done < "$TMPFILE"
rm -f "$TMPFILE"

# ======================
# Affichage récapitulatif
# ======================
echo "Fichiers à retirer de l'index (>= ${THRESHOLD_BYTES} bytes):"
if [ ${#TO_REMOVE[@]} -eq 0 ]; then
    echo "  (aucun)"
else
    for f in "${TO_REMOVE[@]}"; do
        echo "  - $f ($(filesize "$f" || echo '?') bytes)"
    done
fi

echo
echo "Fichiers candidats pour Git LFS (entre ${LFS_MIN_BYTES} et ${LFS_MAX_BYTES} bytes):"
if [ ${#TO_LFS[@]} -eq 0 ]; then
    echo "  (aucun)"
else
    for f in "${TO_LFS[@]}"; do
        echo "  - $f ($(filesize "$f" || echo '?') bytes)"
    done
fi

# ======================
# Action : retirer de l'index
# ======================
if $DRY_RUN; then
    echo
    echo "Mode dry-run : aucune modification appliquée. Relancer avec --apply pour exécuter."
    exit 0
fi

if [ ${#TO_REMOVE[@]} -gt 0 ]; then
    echo
    echo "Retrait des fichiers de l'index (git rm --cached) ..."
    for f in "${TO_REMOVE[@]}"; do
        echo " -> git rm --cached -- \"$f\""
        git rm --cached -- "$f"
    done
else
    echo "Rien à retirer de l'index."
fi

# ======================
# Optionnel : mettre les candidats en LFS (si installé)
# ======================
if [ ${#TO_LFS[@]} -gt 0 ]; then
    if $HAS_GIT_LFS; then
        echo
        echo "Git LFS détecté : ajout des fichiers candidats à LFS..."
        for f in "${TO_LFS[@]}"; do
            echo " -> git lfs track -- \"$f\""
            git lfs track -- "$f"
            # ajouter le fichier (il est déjà suivi dans l'historique; pour que LFS prenne effet il faudrait réécrire l'historique,
            # mais on ajoute la piste .gitattributes et on ré-ajoute le fichier pour les futurs commits)
            git add -- "$f"
        done
        git add .gitattributes || true
    else
        echo
        echo "Git LFS non installé : sauter l'étape LFS. Installer git-lfs si tu veux l'utiliser."
    fi
fi

# ======================
# Commit & push si nécessaire
# ======================
# Vérifier s'il y a quelque-chose à commit
if git diff --cached --quiet; then
    echo "Aucun changement à committer."
    exit 0
fi

git commit -m "Cleanup: supprime fichiers volumineux du suivi git (>= ${THRESHOLD_BYTES} bytes) et ajoute pistes LFS"
echo "Commit effectué."

if $GIT_PUSH; then
    echo "Push vers origin ($(git rev-parse --abbrev-ref HEAD)) ..."
    git push
    echo "Push OK."
else
    echo "Push désactivé (--no-push). Tu peux pousser manuellement."
fi

echo "Terminé."
