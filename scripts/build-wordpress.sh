# Package the Vite build into wordpress/ for upload to kastoriafm.gr/webapp
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/wordpress"
DIST="$ROOT/dist"

cd "$ROOT"
npm run build

# Keep server-side helpers, replace static assets with fresh build
find "$OUT" -mindepth 1 -maxdepth 1 \
  ! -name 'stream.php' \
  ! -name '.htaccess' \
  ! -name 'UPLOAD.md' \
  -exec rm -rf {} +

cp -R "$DIST"/. "$OUT"/
# Ensure stream rewrite target exists after copy
test -f "$OUT/stream.php"
test -f "$OUT/.htaccess"

echo "Ready to upload contents of: $OUT"
echo "Upload into: public_html/webapp/ (or equivalent)"
