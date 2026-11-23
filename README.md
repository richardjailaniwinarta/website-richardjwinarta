# directory-richardva

Website pribadi Richard J. Winarta: halaman utama, halaman produk digital, halaman link dengan panel admin, dan landing page produk. Berjalan di Cloudflare Workers, dan data halaman link disimpan di Cloudflare KV.

| Alamat | Isi | Sumber |
|---|---|---|
| `/` | Halaman utama (hero, layanan, tentang, paket, kontak) | `public/index.html` |
| `/produk` | Daftar produk digital dengan filter | `public/produk.html` |
| `/links` | Halaman link (tema Kartu Logam, Sinema Malam, Kaca Bara, atau Galeri Putih) | dibuat Worker dari data KV |
| `/admin` | Admin halaman link: atur profil, foto, link, tema, warna, dan efek dengan pratinjau langsung. Perubahan tersimpan sebagai draft dan baru tampil setelah menekan **Terbitkan**. | `worker/` dan `public/admin-assets/` |
| `/studio-kartun-3d/` | Landing page produk Studio Kartun 3D | `public/studio-kartun-3d/` |

Halaman utama dan halaman produk adalah file statis. CSS, JavaScript, dan gambarnya ada di `public/assets/css`, `public/assets/js`, dan `public/assets/img`. Untuk mengubah teks, harga, atau link produk, edit `public/index.html`, `public/produk.html`, dan data tab di `public/assets/js/main.js`.

## Memasang di Cloudflare

Lakukan sesuai urutan. Kode harus sudah ada di GitHub.

### 1. Buat penyimpanan KV

1. Masuk ke [dash.cloudflare.com](https://dash.cloudflare.com).
2. Buka **Storage & Databases → Workers KV**, lalu klik tombol untuk membuat penyimpanan baru. Nama menu bisa sedikit berbeda karena Cloudflare kadang mengubahnya.
3. Beri nama `directory-richardva-data`, lalu simpan.
4. Salin **ID** penyimpanan itu.

### 2. Tulis ID ke `wrangler.toml`

Buka file `wrangler.toml`, lalu ganti `GANTI_DENGAN_ID_KV` dengan ID tadi. ID ini bukan rahasia.

Di GitHub Desktop: tulis ringkasan, klik **Commit to main**, lalu **Push origin**.

### 3. Hubungkan GitHub ke Cloudflare

1. Buka **Workers & Pages → Create application**.
2. Pilih **GitHub**, lalu izinkan akses ke repo `directory-richardva`.
3. Pastikan nama project `directory-richardva`, sama dengan `name` di `wrangler.toml`.
4. Biarkan perintah deploy `npx wrangler deploy`, lalu klik **Save and Deploy**.

### 4. Atur akun admin

1. Buka Worker `directory-richardva`, lalu **Settings → Variables and Secrets → Add**.
2. Tambahkan dua nilai, keduanya dengan tipe **Secret**:
   - `ADMIN_EMAIL`: email untuk login.
   - `ADMIN_PASSWORD`: kata sandi. Wajib minimal 10 karakter; sebaiknya 16 karakter atau lebih dan tidak dipakai di tempat lain.
3. Klik **Deploy**.

### 5. Isi halamanmu

1. Buka `https://directory-richardva.<nama-akunmu>.workers.dev/admin`, lalu masuk.
2. Klik **Ubah** pada setiap link, lalu isi URL-nya. Link tanpa URL yang valid tidak tampil di halaman public.
3. Klik **Terbitkan**. Perubahan bisa butuh sekitar 1 menit untuk terlihat oleh semua pengunjung.

## Mengubah kode

Setiap push ke branch utama di GitHub otomatis membuat Cloudflare memasang versi baru. Data di KV tidak ikut berubah.

## Ganti kata sandi

Ubah Secret `ADMIN_PASSWORD` di dashboard Cloudflare, lalu klik **Deploy**. Semua sesi lama otomatis keluar.

## Batas paket gratis

| Hal | Batas per hari |
|---|---|
| Permintaan ke Worker | 100.000 |
| Baca data KV | 100.000 |
| Simpan data KV | 1.000 |

Hitungan direset pukul 07.00 WIB. Jika batas simpan habis, admin menampilkan pesan dan halaman public tetap tampil. Draft disimpan 3 detik setelah kamu berhenti mengubah untuk menghemat jatah.

Foto lama yang sudah diganti tidak terhapus otomatis dan tetap memakai jatah penyimpanan KV sebesar 1 GB.

## Mencoba di komputer sendiri

Butuh [Node.js](https://nodejs.org) versi 22 atau lebih baru. Tidak wajib untuk memakai situsnya.

```bash
npm install
```

Salin `.dev.vars.example` menjadi `.dev.vars`, isi email dan kata sandi uji, lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:8787`. Data uji tersimpan di folder `.wrangler` dan terpisah dari data di Cloudflare.

Tes otomatis dijalankan dengan `npm test`.

## Struktur

```text
worker/         Kode server: rute, login, penyimpanan, kerangka HTML
public/         File untuk browser: CSS, JavaScript, gambar, aset admin
public/shared/  Tema, validasi data, dan render halaman (dipakai server dan browser)
test/           Tes otomatis
wrangler.toml   Pengaturan Cloudflare
```
