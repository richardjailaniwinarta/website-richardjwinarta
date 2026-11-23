# Landing page Studio Kartun 3D (untuk Cloudflare Pages)

Halaman statis satu file (`index.html`, ±40 KB) tanpa build, tanpa framework. Tombol beli mengarah ke `https://lynk.id/erjey/9kjeo40vymdl/checkout`.

```
08 Landing Page Cloudflare/
├─ index.html          halaman utama (CSS + JS di dalamnya)
├─ img/                9 gambar WebP + og.jpg (±350 KB total)
├─ robots.txt          izinkan semua + tautan sitemap
├─ sitemap.xml         satu URL
├─ _headers            header keamanan + cache (dibaca Cloudflare Pages)
├─ ganti-domain.sh     ganti placeholder GANTI-DOMAIN.COM
└─ README.md
```

## Langkah pasang

1. **Ganti domain** (Git Bash, di folder ini):
   ```
   sh ganti-domain.sh namadomainmu.com
   grep -n GANTI-DOMAIN index.html robots.txt sitemap.xml
   ```
   Perintah `grep` harus tidak menampilkan apa pun.
2. **Deploy di Cloudflare:** Dashboard → Workers & Pages → Create → Pages → **Upload assets** (direct upload). Beri nama proyek, lalu seret seluruh isi folder ini (index.html, img, robots.txt, sitemap.xml, `_headers`). Klik Deploy.
3. **Domain sendiri:** di proyek Pages → Custom domains → tambahkan domainmu dan ikuti petunjuk DNS. HTTPS otomatis. Nama menu Cloudflare bisa berubah; cari "Custom domains" di proyek Pages.
4. **Search Console:** tambahkan properti domain, kirim `https://domainmu.com/sitemap.xml`.
5. **Uji:** Rich Results Test (Product), PageSpeed Insights, dan pratinjau tautan di WhatsApp/Instagram (gambar OG).
6. **Analitik (opsional):** di Cloudflare → Web Analytics, salin snippet dan tempel tepat di atas `</body>` pada `index.html` (ada komentar penandanya). Tidak memakai cookie.

## Mengubah isi

- Harga, tautan beli, dan angka ada langsung di `index.html`. Cari `149.000` dan `lynk.id/erjey` (tautan checkout ada di 5 tempat bertanda `data-cta`).
- Angka alat bantu: `SPS` (detik render per detik video) dan harga langganan ada di bagian `<script>` paling bawah.
- Kalau harga atau produk berubah, ubah juga JSON-LD `offers.price` di bagian `<head>` supaya sama dengan teks yang tampil.
- **Jangan** menambahkan testimoni, hitung mundur, atau "stok terbatas" kecuali nyata (lihat brief di `digital-product/marketing/`).
