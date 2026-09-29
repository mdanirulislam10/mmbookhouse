"use client";

import { useState } from "react";
import { addStaff, updateStaff } from "@/app/admin/actions/staff";
import { useRun } from "@/components/admin/useRun";
import { Panel, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { ROLE_LABEL } from "@/lib/admin/permissions";
import type { StaffRole } from "@/lib/types";

export interface StaffRow { user_id: string; role: StaffRole; display_name: string | null; email: string | null; is_active: boolean }

export function StaffManager({ rows, me }: { rows: StaffRow[]; me: string }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("dispatch_staff");
  return (
    <div className="space-y-4">
      <Panel title={t("admin.staff.add")}>
        <p className="mb-3 text-sm text-slate-600">{t("admin.staff.help")}</p>
        <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" onSubmit={(e) => { e.preventDefault(); run(() => addStaff({ email, role }), { onOk: () => setEmail("") }); }}>
          <Field label={t("common.email")} htmlFor="st-e"><Input id="st-e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label={t("admin.staff.role")} htmlFor="st-r">
            <Select id="st-r" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r][lang]}</option>)}
            </Select>
          </Field>
          <div className="flex items-end"><Button type="submit" disabled={pending}>{t("common.add")}</Button></div>
        </form>
      </Panel>
      <Panel padded={false}>
        <Table>
          <thead><tr><Th>{t("common.name")}</Th><Th>{t("common.email")}</Th><Th>{t("admin.staff.role")}</Th><Th>{t("common.status")}</Th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.user_id}>
                <Td className="font-medium">{s.display_name ?? "—"}{s.user_id === me ? <Badge tone="blue" className="ml-2">{t("admin.staff.you")}</Badge> : null}</Td>
                <Td>{s.email ?? "—"}</Td>
                <Td>
                  <Select value={s.role} disabled={pending || s.user_id === me} onChange={(e) => run(() => updateStaff({ userId: s.user_id, role: e.target.value as StaffRole }))} className="h-8 w-52">
                    {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r][lang]}</option>)}
                  </Select>
                </Td>
                <Td>
                  <Button size="sm" variant={s.is_active ? "secondary" : "primary"} disabled={pending || s.user_id === me} onClick={() => run(() => updateStaff({ userId: s.user_id, isActive: !s.is_active }))}>
                    {s.is_active ? t("admin.staff.deactivate") : t("admin.staff.activate")}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
