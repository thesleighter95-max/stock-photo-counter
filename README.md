# Stock Photo Counter - Netlify Blobs

Aplikasi ini menyimpan:
- Foto watermark ke Netlify Blobs store `stock-photos`
- Data barang ke Netlify Blobs store `stock-items`

## Cara deploy paling mudah

### Opsi A — Deploy dari GitHub
1. Extract ZIP ini.
2. Upload seluruh folder ke repository GitHub.
3. Di Netlify pilih **Add new project / Import an existing project**.
4. Hubungkan repository GitHub.
5. Deploy.

Netlify akan membaca `netlify.toml` dan menginstall dependency `@netlify/blobs`.

### Penting
Untuk aplikasi yang memakai Netlify Functions + npm dependency, jangan hanya mengupload `index.html`.
Seluruh project termasuk:
- package.json
- netlify.toml
- netlify/functions/items.mjs
- netlify/functions/photo.mjs
harus ikut terdeploy.

Jika Anda menggunakan Netlify Drop/manual drag-and-drop dan Functions tidak terbentuk,
gunakan deploy dari Git repository karena itu paling aman untuk build dependency.

## Endpoint
- GET `/api/items` : daftar data
- POST `/api/items` : simpan foto + metadata
- DELETE `/api/items?id=...` : hapus data + foto
- GET `/api/photo?id=...` : tampilkan foto

## Batas foto
Frontend mengecilkan foto hingga lebar maksimal 1280 px dan JPEG quality 0.78.
Server menolak file lebih dari 4 MB agar aman terhadap batas request Functions.

## Watermark
Watermark dibuat di browser sebelum upload:
- tanggal + jam
- nama lokasi manual (jika diisi)
- latitude / longitude GPS
- akurasi GPS

## Catatan keamanan
Versi ini belum memakai login. Siapa pun yang memiliki akses ke URL website dapat melihat,
menambah, dan menghapus data melalui antarmuka/API. Tambahkan autentikasi jika website
akan digunakan secara publik.
