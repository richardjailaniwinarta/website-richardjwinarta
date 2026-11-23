#!/bin/sh
# Ganti placeholder GANTI-DOMAIN.COM dengan domain aslimu di semua file.
# Pakai (Git Bash):  sh ganti-domain.sh namadomainmu.com
# Hasil: canonical, og:url, og:image, JSON-LD, robots.txt, dan sitemap.xml menunjuk ke domainmu.
set -e
DOM="${1:?usage: sh ganti-domain.sh namadomainmu.com  (tanpa https:// dan tanpa garis miring)}"
cd "$(dirname "$0")"
for f in index.html robots.txt sitemap.xml; do
  sed -i "s/GANTI-DOMAIN\.COM/$DOM/g" "$f"
done
echo "Selesai. Cek: grep -n GANTI-DOMAIN index.html robots.txt sitemap.xml  (harus kosong)"
