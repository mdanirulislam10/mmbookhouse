import { Metadata } from 'next';
import { AdminLoginForm } from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'অ্যাডমিন লগইন | M.M Book House Malda',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950">MM</div>
          <h1 className="text-xl font-black">M.M Book House অ্যাডমিন</h1>
          <p className="mt-1 text-sm text-slate-400">অনুমোদিত মালিক বা সুপার অ্যাডমিনের জন্য</p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
