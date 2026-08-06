export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface LevelData {
  id: number;
  title: string;
  material: string;
  timerSeconds: number;
  scenario: string;
  imageUrl?: string;
  options: Option[];
  explanation: string;
  defaultPromptToTest?: string;
}

// GAME 1: AI PROMPT CHALLENGE (5 SOAL TEXT ASSISTANT + 5 SOAL TEBAK GAMBAR VISUAL)
export const GAME_1_PROMPT_LEVELS: LevelData[] = [
  // --- BAGIAN 1: 5 SOAL TEXT ASSISTANT ---
  {
    id: 1,
    title: "Level 1: Role Prompting",
    material: "Role Prompting: Memberikan AI peran khusus (contoh: HR Senior) agar nada & format jawaban otomatis profesional.",
    timerSeconds: 30,
    scenario: "Pilih perintah paling tepat untuk membuat pengumuman piket kantor resmi:",
    options: [
      { id: "A", text: "Buat pengumuman piket libur nasional untuk karyawan.", isCorrect: false },
      { id: "B", text: "Bertindaklah sebagai HR Senior. Susun draf resmi pengumuman piket libur nasional divisi operasional.", isCorrect: true },
      { id: "C", text: "Tuliskan nama karyawan yang masuk libur nasional.", isCorrect: false }
    ],
    explanation: "Memberi peran 'HR Senior' memastikan AI menghasilkan format dan bahasa resmi kantor."
  },
  {
    id: 2,
    title: "Level 2: Formula K-I-F",
    material: "Formula K-I-F = Konteks (latar belakang), Instruksi (perintah), dan Format (tampilan seperti tabel/bullet).",
    timerSeconds: 25,
    scenario: "Rangkum 50 ulasan pelanggan ke bentuk ringkas. Mana prompt K-I-F terbaik?",
    options: [
      { id: "A", text: "Rangkum 50 ulasan ini dengan cepat dan jelas.", isCorrect: false },
      { id: "B", text: "Konteks: Evaluasi bulanan. Instruksi: Analisis 50 ulasan ini. Format: Sajikan dalam Tabel 3 Kolom.", isCorrect: true },
      { id: "C", text: "Tulis paragraf panjang berisi ulasan pelanggan.", isCorrect: false }
    ],
    explanation: "Menyebutkan format secara eksplisit ('Tabel 3 Kolom') menghasilkan laporan yang langsung rapi."
  },
  {
    id: 3,
    title: "Level 3: Negative Constraint (Batasan)",
    material: "Negative Constraint = Menentukan apa yang TIDAK BOLEH dilakukan AI (misal: batasan kata / hindari istilah rumit).",
    timerSeconds: 20,
    scenario: "Minta AI buat ringkasan laporan keuangan untuk Direktur Utama yang sibuk:",
    options: [
      { id: "A", text: "Buat ringkasan laporan Q3 lengkap.", isCorrect: false },
      { id: "B", text: "Susun ringkasan Q3. Batasan: Maksimal 100 kata, hindari istilah teknis, gunakan poin utama.", isCorrect: true },
      { id: "C", text: "Tulis ulang seluruh laporan keuangan tanpa angka.", isCorrect: false }
    ],
    explanation: "Memberi batasan maksimal 100 kata membuat pesan eksekutif padat dan tidak bertele-tele."
  },
  {
    id: 4,
    title: "Level 4: Delimiter Teks (\x22\x22\x22)",
    material: "Delimiter: Penggunaan tanda petik tiga (\x22\x22\x22) untuk memisahkan instruksi perintah dari dokumen teks asli.",
    timerSeconds: 20,
    scenario: "Mengapa kita disarankan membungkus dokumen referensi dengan tanda \x22\x22\x22 di dalam prompt?",
    options: [
      { id: "A", text: "Agar AI tahu mana bagian perintah dan mana bagian dokumen yang harus dianalisis.", isCorrect: true },
      { id: "B", text: "Membuat tampilan prompt jadi berwarna biru.", isCorrect: false },
      { id: "C", text: "Wajib digunakan agar AI tidak mengalami error sistem.", isCorrect: false }
    ],
    explanation: "Pemisah (\x22\x22\x22) mencegah AI bingung membedakan kalimat instruksi dengan teks dokumen."
  },
  {
    id: 5,
    title: "Level 5: Menghindari AI Hallucination",
    material: "Halusinasi AI: AI membuat jawaban fiktif saat tidak tahu. Solusinya: Instruksikan AI untuk menjawab 'Saya tidak tahu' jika data tidak ada.",
    timerSeconds: 20,
    scenario: "Bagaimana cara mencegah AI mengarang fakta saat diminta merangkum SOP perusahaan?",
    options: [
      { id: "A", text: "Tambahkan instruksi: 'Jawab hanya berdasarkan SOP di atas. Jika tidak ada di dokumen, jawab Tidak Tahu'.", isCorrect: true },
      { id: "B", text: "Minta AI mencari informasi tambahan dari internet publik.", isCorrect: false },
      { id: "C", text: "Gunakan bahasa Inggris agar AI lebih pintar.", isCorrect: false }
    ],
    explanation: "Batasan ketat memaksa AI hanya merujuk dokumen resmi tanpa mengarang fakta."
  },

  // --- BAGIAN 2: 5 SOAL TEBAK GAMBAR AI VISUAL ---
  {
    id: 6,
    title: "Level 6: Visual Product Photo",
    material: "Gunakan kata kunci fotografi seperti 'shallow depth of field' dan 'bokeh' untuk membuat produk utama tampil tajam.",
    timerSeconds: 25,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    scenario: "Foto kopi di atas meja kafe kayu. Mana prompt visual yang presisi untuk gambar ini?",
    options: [
      { id: "A", text: "Foto cangkir kopi panas di kafe nyaman, fokus tajam.", isCorrect: false },
      { id: "B", text: "Fotografi komersial kopi beruap, shallow depth of field, cahaya alami sore, background bokeh kayu.", isCorrect: true },
      { id: "C", text: "Lukisan cat air cangkir kopi warna biru dingin di studio.", isCorrect: false }
    ],
    explanation: "Istilah 'shallow depth of field' & 'bokeh' memburamkan latar belakang agar cangkir kopi tampak menonjol.",
    defaultPromptToTest: "Fotografi komersial kopi beruap, shallow depth of field, cahaya alami sore, background bokeh kayu"
  },
  {
    id: 7,
    title: "Level 7: Visual Architecture",
    material: "Untuk desain vila/arsitektur, sebutkan pencahayaan spesifik seperti 'golden hour sunset' dan material kaca/pantulan.",
    timerSeconds: 25,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    scenario: "Mana prompt visual paling akurat untuk gambar vila modern dengan kolam renang saat sunset ini?",
    options: [
      { id: "A", text: "Foto vila mewah modern dinding kaca, pencahayaan golden hour sunset, pantulan kolam renang infinity.", isCorrect: true },
      { id: "B", text: "Foto rumah sederhana di pantai malam hari.", isCorrect: false },
      { id: "C", text: "Render 3D vila minimalis siang hari terang.", isCorrect: false }
    ],
    explanation: "Deskripsi 'golden hour sunset' dan 'dinding kaca' menciptakan pencahayaan visual yang presisi.",
    defaultPromptToTest: "Foto vila mewah modern dinding kaca, pencahayaan golden hour sunset, pantulan kolam renang infinity"
  },
  {
    id: 8,
    title: "Level 8: Visual Fantasy Character",
    material: "Konsep karakter fantasi membutuhkan rincian zirah, pencahayaan dramatis, dan efek elemen seperti naga/petir.",
    timerSeconds: 25,
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    scenario: "Mana prompt visual terbaik untuk karakter kesatria emas berlatar aura naga ini?",
    options: [
      { id: "A", text: "Gambar kartun anak-anak tentang naga terbang.", isCorrect: false },
      { id: "B", text: "Karakter kesatria armor emas berkilau, memegang pedang bercahaya, aura naga di latar belakang, gaya konsep seni fantasi 8K.", isCorrect: true },
      { id: "C", text: "Sketsa hitam putih seorang prajurit abad pertengahan.", isCorrect: false }
    ],
    explanation: "Detail 'armor emas', 'pedang bercahaya', dan 'gaya konsep seni fantasi' mencirikan prompt visual karakter.",
    defaultPromptToTest: "Karakter kesatria armor emas berkilau, memegang pedang bercahaya, aura naga di latar belakang, gaya konsep seni fantasi 8K"
  },
  {
    id: 9,
    title: "Level 9: Visual Cyberpunk City",
    material: "Gaya Cyberpunk identik dengan lampu neon reflektif, jalanan basah malam hari, dan bangunan tinggi futuristik.",
    timerSeconds: 25,
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80",
    scenario: "Pilih prompt AI visual yang sesuai untuk kota futuristik malam hari berkabut neon berikut:",
    options: [
      { id: "A", text: "Pemandangan kota cyberpunk futuristik malam hari, pantulan lampu neon di jalanan basah hujan, gedung pencakar langit berawan.", isCorrect: true },
      { id: "B", text: "Foto desa pedesaan hijau di pagi hari cerah.", isCorrect: false },
      { id: "C", text: "Lukisan minyak kota tua Eropa abad 18.", isCorrect: false }
    ],
    explanation: "Kata kunci 'cyberpunk', 'lampu neon', dan 'jalanan basah hujan' memunculkan estetika kota futuristik.",
    defaultPromptToTest: "Pemandangan kota cyberpunk futuristik malam hari, pantulan lampu neon di jalanan basah hujan, gedung pencakar langit berawan"
  },
  {
    id: 10,
    title: "Level 10: Visual Workspace Interior",
    material: "Foto interior profesional menggunakan gaya pencahayaan 'soft ambient light' dan penataan ruang kerja minimalis modern.",
    timerSeconds: 25,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    scenario: "Mana prompt visual paling pas untuk menggambarkan ruang kerja kantor minimalis bersuasana tenang ini?",
    options: [
      { id: "A", text: "Foto interior kantor minimalis modern, meja kayu rapi dengan laptop, tanaman hijau hias, pencahayaan lembut siang hari.", isCorrect: true },
      { id: "B", text: "Gudang barang bekas yang berantakan dan gelap.", isCorrect: false },
      { id: "C", text: "Ruang tamu keluarga bergaya klasik gaya Jawa.", isCorrect: false }
    ],
    explanation: "Menyebutkan elemen 'kantor minimalis modern', 'meja kayu', dan 'pencahayaan lembut' menghasilkan visual interior yang bersih.",
    defaultPromptToTest: "Foto interior kantor minimalis modern, meja kayu rapi dengan laptop, tanaman hijau hias, pencahayaan lembut siang hari"
  }
];

// GAME 2: PPT MASTERY QUIZ (TOTAL 10 SOAL)
export const GAME_2_PPT_LEVELS: LevelData[] = [
  {
    id: 1,
    title: "Materi 1: Peran AI bagi Pekerja",
    material: "Mengenal AI: AI memproses data besar untuk solusi otomatis. Prinsip penting: AI mempercepat, bukan menggantikan manusia.",
    timerSeconds: 30,
    scenario: "Berdasarkan materi presentasi, apa prinsip paling utama dari penggunaan AI kantor?",
    options: [
      { id: "A", text: "AI menggantikan penuh seluruh staf kantor.", isCorrect: false },
      { id: "B", text: "AI mempercepat kerja, manusia tetap pengambil keputusan & pemeriksa akhir.", isCorrect: true },
      { id: "C", text: "AI selalu 100% benar tanpa perlu diperiksa ulang.", isCorrect: false }
    ],
    explanation: "AI berfungsi sebagai asisten digital super cepat. Keputusan akhir tetap di tangan Anda."
  },
  {
    id: 2,
    title: "Materi 2: Analogi Staf Magang",
    material: "Memberi prompt ke AI seperti membriefing staf magang pintar di hari pertama: butuh konteks jelas agar hasilnya tidak asal.",
    timerSeconds: 25,
    scenario: "Mengapa istilah 'Garbage In, Garbage Out' sangat relevan pada AI?",
    options: [
      { id: "A", text: "Perintah asal/seadanya akan menghasilkan jawaban yang seadanya dan banyak salah.", isCorrect: true },
      { id: "B", text: "AI hanya bisa memproses data sampah.", isCorrect: false },
      { id: "C", text: "Prompt panjang pasti menghasilkan data salah.", isCorrect: false }
    ],
    explanation: "Kualitas perintah (input) menentukan langsung kualitas hasil (output) AI."
  },
  {
    id: 3,
    title: "Materi 3: Anatomi K-I-F",
    material: "Anatomi Prompt terdiri dari 3 elemen dasar K-I-F: Konteks, Instruksi, dan Format.",
    timerSeconds: 20,
    scenario: "Singkatan dari apakah elemen K-I-F dalam penyusunan prompt?",
    options: [
      { id: "A", text: "Komunikasi - Informasi - Fakta", isCorrect: false },
      { id: "B", text: "Konteks - Instruksi - Format", isCorrect: true },
      { id: "C", text: "Kategori - Ide - Formulir", isCorrect: false }
    ],
    explanation: "K-I-F kepanjangan dari Konteks (latar), Instruksi (perintah), dan Format (tampilan akhir)."
  },
  {
    id: 4,
    title: "Materi 4: Analitik Bisnis AI",
    material: "Alur kerja analitik AI: Data Mentah -> Prompt K-I-F -> Temukan Insight (Anomali/Tren) -> Keputusan Manusia.",
    timerSeconds: 20,
    scenario: "Saat data penjualan Q3 mendadak turun 24%, apa peran awal AI dalam analitik bisnis?",
    options: [
      { id: "A", text: "Langsung memecat Manajer Penjualan.", isCorrect: false },
      { id: "B", text: "Menandai anomali penurunan data untuk ditelusuri faktor penyebabnya.", isCorrect: true },
      { id: "C", text: "Mengubah angka Q3 agar kelihatan naik.", isCorrect: false }
    ],
    explanation: "AI membantu mendeteksi pola/anomali data secara cepat untuk bahan analisis lanjutan."
  },
  {
    id: 5,
    title: "Materi 5: Etika & Kerahasiaan Data",
    material: "Hati-hati dengan AI: Selalu verifikasi data/angka, dan JANGAN masukkan data pribadi atau rahasia perusahaan ke AI publik.",
    timerSeconds: 15,
    scenario: "Hal apa yang DILARANG saat menggunakan layanan AI publik di kantor?",
    options: [
      { id: "A", text: "Meminta AI merangkum jadwal rapat.", isCorrect: false },
      { id: "B", text: "Menempelkan data pribadi pelanggan atau dokumen rahasia perusahaan.", isCorrect: true },
      { id: "C", text: "Menggunakan prompt bertipe Role.", isCorrect: false }
    ],
    explanation: "Menjaga data rahasia perusahaan dan data pribadi adalah kewajiban utama keamanan informasi."
  },
  {
    id: 6,
    title: "Materi 6: 4 Teknik Utama Prompting",
    material: "Empat teknik utama prompting: Role Prompting, K-I-F Formula, Few-Shot Prompting, dan Constraint (Batasan).",
    timerSeconds: 20,
    scenario: "Teknik mana yang fokus menentukan batasan hal yang BUKAN bagian dari tugas AI?",
    options: [
      { id: "A", text: "Constraint / Batasan", isCorrect: true },
      { id: "B", text: "Role Prompting", isCorrect: false },
      { id: "C", text: "Few-Shot Prompting", isCorrect: false }
    ],
    explanation: "Constraint menetapkan batasan (seperti max kata, hindari istilah teknis, dll)."
  },
  {
    id: 7,
    title: "Materi 7: Visual Prompt Style",
    material: "Visual Prompting membutuhkan deskripsi detail seperti style visual (photo/3d render), lighting, dan komposisi kamera.",
    timerSeconds: 20,
    scenario: "Mana kombinasi elemen terbaik untuk menghasilkan prompt foto produk realistis?",
    options: [
      { id: "A", text: "Gunakan kata kunci: Gaya Fotografi + Pencahayaan Alami + Detail Fokus Kamera.", isCorrect: true },
      { id: "B", text: "Cukup tulis 'Buatkan foto yang bagus dan keren'.", isCorrect: false },
      { id: "C", text: "Gunakan kalimat panjang berisi cerita latar produk.", isCorrect: false }
    ],
    explanation: "Deskripsi teknis fotografi menghasilkan output gambar AI yang paling realistis."
  },
  {
    id: 8,
    title: "Materi 8: Evaluasi Analitik Bisnis Q1-Q4",
    material: "AI membantu membandingkan tren penjualan antar kuartal (Q1 hingga Q4) untuk menemukan pola musiman.",
    timerSeconds: 20,
    scenario: "Penjualan melonjak tinggi di Q4 menjelang akhir tahun. AI menandai ini sebagai pola apa?",
    options: [
      { id: "A", text: "Pola Musiman (Seasonal Trend) libur akhir tahun.", isCorrect: true },
      { id: "B", text: "Kesalahan input data kasir.", isCorrect: false },
      { id: "C", text: "Anomali kerugian bisnis.", isCorrect: false }
    ],
    explanation: "Lonjakan berulang pada periode akhir tahun dikategorikan sebagai tren musiman bisnis."
  },
  {
    id: 9,
    title: "Materi 9: Verifikasi & Human in the Loop",
    material: "Human in the Loop: Konsep di mana hasil AI wajib diverifikasi dan disetujui manusia sebelum dipublikasikan.",
    timerSeconds: 20,
    scenario: "Mengapa laporan analisis dari AI tidak boleh langsung dikirim ke Klien tanpa dibaca ulang?",
    options: [
      { id: "A", text: "Karena AI bisa mengalami halusinasi angka atau istilah yang tidak tepat.", isCorrect: true },
      { id: "B", text: "Karena Klien tahu kalau itu ditulis oleh AI.", isCorrect: false },
      { id: "C", text: "Karena file AI otomatis terhapus dalam 1 jam.", isCorrect: false }
    ],
    explanation: "Verifikasi manusia (Human in the Loop) mencegah risiko error atau informasi salah ke klien."
  },
  {
    id: 10,
    title: "Materi 10: Iterasi Prompt Berkelanjutan",
    material: "Iterasi: Jika hasil pertama AI kurang pas, jangan ganti topik, melainkan perbaiki prompt dengan memberikan feedback koreksi.",
    timerSeconds: 15,
    scenario: "Apa tindakan terbaik jika hasil rangkuman AI terasa terlalu panjang?",
    options: [
      { id: "A", text: "Beri instruksi koreksi: 'Persingkat menjadi 3 poin utama saja'.", isCorrect: true },
      { id: "B", text: "Hapus seluruh percakapan dan mulai dari awal.", isCorrect: false },
      { id: "C", text: "Menyerah dan mengetik manual.", isCorrect: false }
    ],
    explanation: "Iterasi dengan memberi umpan balik koreksi adalah cara paling efisien menyempurnakan hasil AI."
  }
];