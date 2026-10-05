import { redirect } from "next/navigation";
import { getSessionUser, getStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCounters } from "@/lib/admin/data";
import { ROLE_LABEL } from "@/lib/admin/permissions";
import { rolesFor, type Area } from "@/lib/admin/permissions";
import { ToastProvider } from "@/components/ui/Toaster";

const AREAS: Area[] = ["dashboard", "orders", "books", "inventory", "catalog", "marketing", "reviews", "customers", "reports", "enquiries", "partners", "settings", "staff", "backups", "audit"];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const staff = await getStaff();
  const { t, lang } = await getT();

  if (!staff) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-navy px-6 text-center text-white">
        <h1 className="text-2xl font-bold">{t("admin.noAccess")}</h1>
        <p className="max-w-md text-slate-300">{t("admin.noAccessText", { email: user.email ?? "" })}</p>
        <form action="/auth/signout?next=/admin/login" method="post">
          <button className="rounded-full bg-brand-amber px-6 py-2.5 font-semibold text-brand-ink">{t("nav.signOut")}</button>
        </form>
      </main>
    );
  }

  const allowed = AREAS.filter((a) => rolesFor(a).includes(staff.role));
  const c = await getCounters();
  return (
    <ToastProvider>
      <AdminShell
        allowed={allowed}
        userName={(staff.name ?? staff.email ?? "").split(/[ @]/)[0]}
        roleLabel={ROLE_LABEL[staff.role][lang]}
        counters={{ pendingOrders: c.pending_orders, verifyPayments: c.verify_payments, lowStock: c.low_stock, enquiries: c.enquiries, reviews: c.reviews }}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
