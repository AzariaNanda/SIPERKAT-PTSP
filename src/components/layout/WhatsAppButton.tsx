import { MessageCircle } from "lucide-react";

// Ganti nomor di sini (gunakan kode negara tanpa tanda +)
const WHATSAPP_NUMBER = "6287876974117";

// Teks pesan otomatis yang akan muncul di chat
const DEFAULT_MESSAGE = "Halo Admin, saya ingin bertanya mengenai layanan PTSP di SIPERKAT.";

// Menggabungkan nomor dan pesan ke dalam URL API WhatsApp
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

export const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center justify-center"
      title="Hubungi Admin via WhatsApp"
      aria-label="Chat WhatsApp Admin"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
};
