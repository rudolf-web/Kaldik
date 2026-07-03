import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. API: Gemini Calendar Auditor & Auto-Fill Sync
app.post('/api/gemini/sync', async (req, res) => {
  try {
    const { config, events } = req.body;
    
    if (!config || !events) {
      return res.status(400).json({ error: 'Config and events parameters are required.' });
    }

    const ai = getGeminiClient();

    const prompt = `
      Anda adalah seorang Koordinator Kurikulum dan ahli penyusun Kalender Pendidikan (Kaldik) Sekolah Dasar di Indonesia.
      Tugas Anda adalah mengaudit rancangan Kalender Pendidikan untuk SD "MIMI" Citraland, Surabaya, Tahun Pelajaran ${config.schoolYear} (berlangsung dari Juli ${config.startYear} s.d. Juni ${config.startYear + 1}).

      Berikut adalah konfigurasi sekolah saat ini:
      - Nama Sekolah: ${config.schoolName}
      - Kepala Sekolah: ${config.principalName}
      - Kota: ${config.city}
      - Sistem Kerja: ${config.isSixDayWeek ? '6 Hari Kerja (Sabtu masuk)' : '5 Hari Kerja (Sabtu libur)'}
      - Tanggal Pengesahan: ${config.issueDate}

      Berikut adalah daftar kegiatan/libur yang sudah dijadwalkan oleh user (format YYYY-MM-DD):
      ${JSON.stringify(events, null, 2)}

      Lakukan analisis kurikulum:
      1. Periksa apakah hari libur nasional standar Indonesia (LU) untuk Tahun Pelajaran ${config.schoolYear} sudah lengkap dalam daftar kegiatan.
      2. Periksa apakah kegiatan wajib sekolah dasar sudah terpasang dengan benar (seperti MPLS di pertengahan Juli, UTS/ATS di September/Maret, UAS/AAS di Desember/Juni, Pembagian Rapor, dan Libur Semester).
      3. Berikan rekomendasi/audit yang ramah dalam bahasa Indonesia yang ditujukan untuk Kepala Sekolah ${config.principalName} dan ditandatangani oleh Rudolf A. Luhukay (Koordinator Kurikulum).
      4. Jika ada hari libur nasional atau kegiatan penting yang belum terjadwal, buatlah daftar kegiatan tambahan tersebut agar bisa di-import otomatis oleh sistem.

      Format keluaran Anda harus berupa JSON valid dengan struktur:
      {
        "suggestions": "Analisis dan saran kurikulum tertulis panjang dan lengkap dalam bahasa Indonesia yang sangat sopan dan profesional, lengkap dengan salam pembuka kepada Kepala Sekolah, rangkuman, dan tanda tangan penutup Rudolf A. Luhukay.",
        "missingEvents": [
          {
            "id": "ai-unique-id-1",
            "title": "Nama Kegiatan/Hari Libur Nasional",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD",
            "categoryId": "LU" // atau kategori lain yang sesuai (KTS, AS, RPR, MPLS, LS1, LS2, dll)
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['suggestions', 'missingEvents'],
          properties: {
            suggestions: {
              type: Type.STRING,
              description: 'Professional curriculum audit in Indonesian language.',
            },
            missingEvents: {
              type: Type.ARRAY,
              description: 'Array of suggested missing events or national holidays to import.',
              items: {
                type: Type.OBJECT,
                required: ['id', 'title', 'startDate', 'endDate', 'categoryId'],
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  categoryId: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const resultText = response.text || '{}';
    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (err: any) {
    console.error('Gemini Sync Error:', err);
    res.status(500).json({
      error: 'Gagal melakukan sinkronisasi dengan Gemini AI.',
      details: err.message,
    });
  }
});

// 3. Vite development vs static production server setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
