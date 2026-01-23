import { useState, useEffect } from 'react';
import { 
  UserCog, UserPlus, Trash2, Mail, ShieldCheck, ShieldAlert, 
  Loader2, Search, UserCheck, ListPlus, RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PegawaiManagement = () => {
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const MAIN_ADMIN_EMAIL = 'subbagumpeg.dpmptspbms@gmail.com';

  const enrichAndSyncRegistrationStatus = async (rows: any[]) => {
    // Cross-check whitelist vs auth.users via RPC `is_email_registered`
    // - UI akan selalu akurat saat halaman load
    // - DB akan disinkronkan (set is_registered=true) bila ternyata sudah registrasi
    try {
      const checks = await Promise.all(
        (rows || []).map(async (r) => {
          const email = String(r.email || '').toLowerCase().trim();
          if (!email) return { email, isRegistered: false };

          const { data, error } = await supabase.rpc('is_email_registered', { _email: email });
          if (error) {
            console.log('[PegawaiManagement] is_email_registered RPC error', { email, message: error.message });
            return { email, isRegistered: false };
          }
          return { email, isRegistered: !!data };
        })
      );

      const registeredEmailSet = new Set(checks.filter((c) => c.isRegistered).map((c) => c.email));

      const enriched = (rows || []).map((r) => {
        const email = String(r.email || '').toLowerCase().trim();
        const computedRegistered = registeredEmailSet.has(email);
        return {
          ...r,
          // Prioritas: hasil cross-check ke user table
          is_registered: computedRegistered || !!r.is_registered,
        };
      });

      // Sinkron ke DB untuk kasus data whitelist belum ter-update
      const needSyncEmails = enriched
        .filter((r) => {
          const email = String(r.email || '').toLowerCase().trim();
          return registeredEmailSet.has(email) && !r.is_registered;
        })
        .map((r) => String(r.email || '').toLowerCase().trim());

      if (needSyncEmails.length > 0) {
        const { error: syncErr } = await supabase
          .from('pegawai_whitelist')
          .update({ is_registered: true })
          .in('email', needSyncEmails);
        if (syncErr) {
          console.log('[PegawaiManagement] sync whitelist is_registered error', { message: syncErr.message, needSyncEmails });
        }
      }

      return enriched;
    } catch (err) {
      console.log('[PegawaiManagement] enrichAndSyncRegistrationStatus exception', err);
      return rows || [];
    }
  };

  const fetchWhitelist = async () => {
    try {
      const { data, error } = await supabase
        .from('pegawai_whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const enriched = await enrichAndSyncRegistrationStatus(data || []);
      setWhitelist(enriched);
    } catch (error: any) {
      toast.error("Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();

    // Real-time: bila whitelist berubah (insert/update/delete), refresh agar status selalu terbaru
    const channel = supabase
      .channel('public:pegawai_whitelist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pegawai_whitelist' }, () => {
        fetchWhitelist();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddEmail = async () => {
    const email = newEmail.toLowerCase().trim();
    if (!email.includes('@gmail.com')) return toast.error("Hanya email @gmail.com");
    
    setIsSubmitting(true);
    try {
      // Sesuai revisi: is_registered tetap FALSE karena belum daftar di SIPERKAT
      const { error } = await supabase.from('pegawai_whitelist').insert([{ 
        email, 
        role: 'user', 
        is_registered: false 
      }]);
      
      if (error) throw error;
      toast.success("Pegawai berhasil ditambahkan");
      setNewEmail('');
      fetchWhitelist();
    } catch (error: any) {
      toast.error("Email sudah terdaftar atau terjadi kesalahan database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkEmails.trim()) return toast.error("Input masal kosong");
    const emailArray = Array.from(new Set(
      bulkEmails.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@gmail.com'))
    ));

    if (emailArray.length === 0) return toast.error("Tidak ada email gmail valid ditemukan");

    setIsSubmitting(true);
    try {
      const dataToInsert = emailArray.map(email => ({ 
        email, 
        role: 'user', 
        is_registered: false 
      }));

      // Menggunakan upsert agar tidak error jika ada email yang sudah ada
      const { error } = await supabase.from('pegawai_whitelist').upsert(dataToInsert, { onConflict: 'email' });
      if (error) throw error;

      toast.success(`${emailArray.length} Email berhasil diproses.`);
      setBulkEmails('');
      fetchWhitelist();
    } catch (error) {
      toast.error("Gagal memproses pendaftaran masal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = async (email: string, currentRole: string) => {
    if (email === MAIN_ADMIN_EMAIL) return toast.error("Role Admin Utama tidak bisa diubah");
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      // 1. Update tabel Whitelist (untuk tampilan tabel ini)
      const { error: wError } = await supabase.from('pegawai_whitelist').update({ role: newRole }).eq('email', email);
      if (wError) throw wError;

      // 2. REVISI: Sinkronisasi Role ke tabel akses sistem secara real-time
      // Memanggil RPC sync_role_by_email agar hak akses user berubah detik itu juga
      const { error: rpcError } = await supabase.rpc('sync_role_by_email', { 
        _email: email, 
        _new_role: newRole 
      });
      
      if (rpcError) console.warn("User mungkin belum terdaftar di sistem auth, role whitelist berhasil diupdate.");

      toast.success(`Role ${email} diubah menjadi ${newRole.toUpperCase()}`);
      fetchWhitelist();
    } catch (error) {
      toast.error("Gagal mengubah role.");
    }
  };

  const handleDelete = async (email: string) => {
    if (email === MAIN_ADMIN_EMAIL) return toast.error("Admin Utama tidak bisa dihapus");
    if (!confirm(`Cabut akses untuk ${email}? User tidak akan bisa masuk lagi ke sistem.`)) return;
    
    try {
      const { error } = await supabase.from('pegawai_whitelist').delete().eq('email', email);
      if (error) throw error;
      toast.success("Akses pegawai dicabut.");
      fetchWhitelist();
    } catch (error) {
      toast.error("Gagal menghapus.");
    }
  };

  const filteredWhitelist = whitelist.filter(item => 
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && whitelist.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Sinkronisasi Database...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden lg:col-span-1">
          <CardHeader className="bg-slate-50 border-b p-5"><CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-slate-600"><UserPlus className="w-4 h-4" /> Tambah Manual</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-4">
            <Input placeholder="email@gmail.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-12 border-slate-200 focus:ring-primary/20" />
            <Button onClick={handleAddEmail} disabled={isSubmitting} className="w-full h-12 font-black uppercase tracking-widest shadow-md">Daftarkan</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden lg:col-span-2 border-l-4 border-primary">
          <CardHeader className="bg-primary/5 border-b p-5"><CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary"><ListPlus className="w-4 h-4" /> Bulk Add (Excel / WA Paste)</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-3">
            <Textarea placeholder="Paste daftar email di sini (pisahkan dengan koma atau enter)..." value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} className="min-h-[96px] bg-slate-50/50 border-slate-200" />
            <Button onClick={handleBulkAdd} disabled={isSubmitting} variant="default" className="w-full h-12 font-black uppercase shadow-lg shadow-primary/10">Proses Semua Email</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCog className="w-6 h-6 text-primary" />
            <CardTitle className="text-lg font-black uppercase tracking-tighter text-slate-800">Manajemen Akses Pegawai</CardTitle>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input placeholder="Cari email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-10 bg-white border-slate-200 rounded-2xl text-sm" />
            </div>
            <Button variant="outline" size="icon" onClick={fetchWhitelist} className="rounded-xl border-slate-200 hover:bg-primary/5 transition-colors"><RefreshCcw className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none">
                  <TableHead className="w-[80px] text-center font-black text-[10px] uppercase pl-8">No</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Email Pegawai</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-center">Status Akun</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-center">Hak Akses</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase">Kontrol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWhitelist.map((p, index) => (
                  <TableRow key={p.email} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                    <TableCell className="text-center font-mono text-xs text-slate-300 pl-8">{String(index + 1).padStart(2, '0')}</TableCell>
                    <TableCell className="font-bold text-slate-700">{p.email}</TableCell>
                    <TableCell className="text-center">
                      {p.is_registered ? 
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full font-black text-[9px] uppercase border border-green-200"><UserCheck className="w-3 h-3" /> Aktif</span> : 
                        <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-400 rounded-full font-black text-[9px] uppercase">Belum Daftar</span>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase transition-all ${p.role === 'admin' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>{p.role}</span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" disabled={p.email === MAIN_ADMIN_EMAIL} className="text-[9px] font-black uppercase h-8 border-slate-200 hover:border-primary transition-all shadow-sm" onClick={() => toggleRole(p.email, p.role)}>Ubah Role</Button>
                        {p.email !== MAIN_ADMIN_EMAIL && (
                          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 h-8 w-8 transition-all rounded-xl hover:bg-red-50" onClick={() => handleDelete(p.email)}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};