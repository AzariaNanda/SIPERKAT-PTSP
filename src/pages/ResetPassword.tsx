import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

const parseUrlHash = () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return { accessToken: null, error: null };
  const params = new URLSearchParams(hash);
  const error = params.get("error") || params.get("error_code");
  const accessToken = params.get("access_token");
  return { accessToken, error };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { accessToken, error: urlError } = useMemo(() => parseUrlHash(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return toast.error("INPUT DIPERLUKAN", {
        description: "Silakan isi password baru dan konfirmasinya.",
      });
    }

    if (password.length < 6) {
      return toast.error("PASSWORD TERLALU PENDEK", {
        description: "Minimal 6 karakter.",
      });
    }

    if (password !== confirmPassword) {
      return toast.error("KONFIRMASI SALAH", {
        description: "Password baru dan konfirmasi tidak cocok.",
      });
    }

    if (!accessToken) {
      return toast.error("TOKEN TIDAK DITEMUKAN", {
        description: "Silakan buka link dari email reset password Anda.",
      });
    }

    setIsSubmitting(true);

    try {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 20000);

      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        signal: timeoutController.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ password }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg: string =
          errData?.message ||
          errData?.error_description ||
          `HTTP ${response.status}`;
        const msgLower = msg.toLowerCase();

        let title = "GAGAL MEMPERBARUI PASSWORD";
        let desc = "Terjadi kendala teknis. Silakan coba lagi.";

        if (
          msgLower.includes("weak") ||
          msgLower.includes("strength") ||
          msgLower.includes("characters")
        ) {
          title = "PASSWORD TERLALU LEMAH";
          desc = "Gunakan kombinasi huruf besar, huruf kecil, dan angka.";
        } else if (
          msgLower.includes("same") ||
          msgLower.includes("different") ||
          msgLower.includes("previous")
        ) {
          title = "PASSWORD SAMA";
          desc = "Password baru harus berbeda dari password sebelumnya.";
        } else if (
          msgLower.includes("expired") ||
          msgLower.includes("invalid") ||
          msgLower.includes("token") ||
          response.status === 401
        ) {
          title = "LINK KADALUWARSA";
          desc = "Token sudah tidak valid. Silakan minta link reset baru.";
        } else if (msgLower.includes("rate") || response.status === 429) {
          title = "TERLALU BANYAK PERCOBAAN";
          desc = "Tunggu beberapa saat sebelum mencoba lagi.";
        }

        toast.error(title, {
          description: desc,
          icon: <AlertTriangle className="w-5 h-5" />,
        });
        setIsSubmitting(false);
        return;
      }

      toast.success("PASSWORD BERHASIL DIPERBARUI!", {
        description: "Mengalihkan ke halaman login...",
      });
      setIsSubmitting(false);

      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      toast.error(isTimeout ? "TIMEOUT" : "KESALAHAN JARINGAN", {
        description: isTimeout
          ? "Server tidak merespons. Periksa koneksi internet Anda."
          : "Terjadi kesalahan. Silakan coba lagi.",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      setIsSubmitting(false);
    }
  };

  if (urlError) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
            <CardContent className="pt-12 pb-10 px-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800 mb-3">
                Link Tidak Valid
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">
                Link reset password ini sudah <strong>kadaluwarsa</strong> atau{" "}
                <strong>sudah pernah digunakan</strong>.
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-8">
                Setiap link reset hanya bisa diklik <u>satu kali</u>.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full h-12 font-black uppercase tracking-widest rounded-2xl">
                  Minta Link Reset Baru
                </Button>
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest mt-5"
              >
                <ArrowLeft className="w-3 h-3" /> Kembali ke Login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
          <CardContent className="pt-12 pb-10 px-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <KeyRound className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
                Password Baru
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                Buatlah kata sandi baru yang kuat <br /> untuk mengamankan akun
                SIPERKAT Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500 tracking-wider px-1">
                  Password Baru
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500 tracking-wider px-1">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    disabled={isSubmitting}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all rounded-2xl mt-4"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    MEMPROSES...
                  </span>
                ) : (
                  "UPDATE PASSWORD"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
