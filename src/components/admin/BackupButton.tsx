"use client";

import { DatabaseBackup } from "lucide-react";
import { requestBackup } from "@/app/admin/actions/backups";
import { useRun } from "@/components/admin/useRun";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

export function BackupButton() {
  const { t } = useT();
  const { run, pending } = useRun();
  return (
    <Button disabled={pending} onClick={() => run(() => requestBackup(), { success: t("admin.backup.started") })}>
      <DatabaseBackup size={16} /> {t("admin.backup.run")}
    </Button>
  );
}
