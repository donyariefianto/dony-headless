# KONSEP ARSITEKTUR CALCULATED FIELD (BLUEPRINT STABILITAS)

Dokumen ini merangkum lima pilar utama untuk membangun fitur Calculated Field yang stabil, bebas loop, dan mampu menangani skenario kompleks seperti repeatable group dan kalkulasi berantai.

---

## PILAR 1: FONDASI STABILITAS (LOOP PROTECTION)

Tujuan utama: Memutus siklus Infinite Recursion (Loop Tak Terbatas) yang terjadi ketika output field calculated memicu kembali kalkulasi global.

### A. Listener Global (setupCalculatedFields)

- **Tugas:** Mendengarkan semua event 'input' di seluruh form.
- **Implementasi Kritis (Pemutus Loop):** Listener **HANYA** boleh memproses event yang berasal dari elemen **YANG BUKAN READONLY**.
  - **Kondisi Kunci:** `!event.target.classList.contains('readonly-field')`.
  - **Penanda HTML:** Semua field calculated dan autofill harus memiliki class `readonly-field`.

### B. Pemicu Berantai (updateCalculatedField)

- **Tugas:** Memastikan field yang dihitung dapat memicu field lain yang bergantung padanya (kalkulasi berantai).
- **Implementasi Kritis (Aman):** Event 'input' hanya dilepaskan (`dispatchEvent`) jika target field tersebut adalah **readonly-field** (yaitu, field calculated).
  - _Hasil:_ Output kode (event dari `readonly-field`) akan dilepas, tetapi segera **diabaikan** oleh Listener Global (Pilar 1.A), sehingga loop terhenti.

---

## PILAR 2: STRUKTUR DATA DAN PEMICU

Bagaimana formula disimpan dan bagaimana proses kalkulasi dimulai dan diulang.

### A. Penyimpanan Formula

- Formula harus disimpan sebagai **atribut data** pada elemen input field calculated.
  - _Contoh:_ `<input type="text" data-calculated-formula="{harga} * {qty}" class="readonly-field" name="subtotal" ...>`

### B. Fungsi Pemicu Utama

- **Fungsi:** `recalculateAllCalculatedFields(formElement)`
- **Mekanisme:** Mengulang (iterate) semua elemen input yang memiliki atribut `data-calculated-formula` dan memanggil `updateCalculatedField` untuk setiap field.
- **Awal:** Fungsi ini dipanggil sekali saat form dimuat (`initializeCalculatedFields`).

---

## PILAR 3: MESIN PARSING FORMULA (ENGINE LOGIC)

Langkah-langkah yang harus dilakukan di dalam fungsi **`updateCalculatedField`** (sebaiknya menggunakan **math.js** untuk evaluasi aman).

| Langkah                       | Deskripsi                                                                                                                               | Tujuan                                                                                             |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **1. Resolusi Agregasi**      | Mengganti fungsi agregasi grup (SUM, AVG, COUNT, dll.) dengan **nilai numerik** hasilnya.                                               | Mempersiapkan formula agar math.js dapat memprosesnya. Harus dilakukan sebelum Resolusi Variabel.  |
| **2. Resolusi Variabel**      | Mengganti placeholder `{field_name}` menjadi kunci variabel aman (e.g., `__field_nama`).                                                | Menciptakan _scope_ data (objek) yang berisi nilai-nilai dari field input yang menjadi dependensi. |
| **3. Evaluasi Aman**          | Mengevaluasi string formula yang sudah diproses (e.g., `150000 * pajak`) menggunakan math.js dalam environment _scope_ yang terisolasi. | Mencegah `eval()` yang berbahaya dan memastikan presisi perhitungan numerik.                       |
| **4. Pembulatan & Set Nilai** | Membulatkan hasil (misalnya, 2 desimal) dan menetapkannya ke `targetElement.value`.                                                     | Memastikan nilai output konsisten dan bersih sebelum memicu Pemicu Berantai (Pilar 1.B).           |

---

## PILAR 4: PENANGANAN GROUP BERULANG (SCOPE MANAGEMENT)

Memastikan kalkulasi berjalan pada scope (lingkup) yang benar di dalam Repeatable Group.

### A. Resolusi Dependensi Internal Grup

- Ketika field target adalah bagian dari grup (e.g., `group[N].subtotal`), dependensi field (e.g., `{qty}`) harus dicari **hanya di baris yang sama** (`group[N].qty`).

### B. Resolusi Dependencies Lintas-Grup

- Jika field di dalam grup bergantung pada field Top-Level (e.g., `{pajak_global}`), sistem harus mencari elemen `[name="pajak_global"]` di **luar scope grup**.

### C. Re-indexing Kritis

- Fungsi **`reIndexGroupRows`** harus dipanggil **SETIAP KALI** baris di grup ditambahkan atau dihapus.
- **Tugas:** Memperbaiki semua atribut `name`, `id`, dan `for` pada baris yang tersisa untuk memastikan indeks array selalu berurutan (0, 1, 2, ...). _Tanpa ini, kalkulasi dan serialisasi data akan rusak._

---

## PILAR 5: FAIL-SAFE DAN KETERSEDIAAN

| Isu                   | Solusi Fail-Safe                                                                                                                             |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------- |
| **Nilai Non-Numerik** | Selalu konversi nilai input menjadi numerik menggunakan `parseFloat(element.value)                                                           |     | 0` saat membangun _scope_ data. |
| **Error Sintaks**     | Evaluasi formula harus dibungkus dalam blok **`try...catch`** untuk mencegah _crash_ aplikasi jika formula tidak valid.                      |
| **Library Math.js**   | Lakukan cek keberadaan `math.js` sebelum evaluasi: `if (typeof window.math === 'undefined') { ... }` dan berikan pesan kesalahan yang jelas. |

---

_Dengan memverifikasi bahwa kode Anda memenuhi semua poin pada kelima pilar ini, Anda akan memiliki implementasi Calculated Field yang sangat stabil dan andal._
