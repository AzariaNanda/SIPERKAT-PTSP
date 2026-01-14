import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '6287876974117';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center justify-center"
      title="Hubungi Admin via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
};
