"use server";

import { revalidatePath } from "next/cache";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { dbError, fail, type ActionResult } from "@/lib/actions";

/** Starts the encrypted backup GitHub Actions workflow and records a job row for the status list. */
export async function requestBackup(): Promise<ActionResult> {
  const staff = await authorize("backups");
  if (!staff) return FORBIDDEN;

  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_BACKUP_TOKEN;
  const workflow = process.env.GITHUB_BACKUP_WORKFLOW || "database-backup.yml";
  const ref = process.env.GITHUB_BACKUP_REF || "main";
  if (!repo || !token) return fail("BACKUP_NOT_CONFIGURED");

  const service = createServiceClient();
  const { data: active } = await service.from("backup_jobs").select("id").in("status", ["queued", "running"]).limit(1);
  if (active?.length) return fail("BACKUP_RUNNING");

  const { data: job, error } = await service.from("backup_jobs").insert({ trigger_type: "manual", status: "queued", requested_by: staff.userId }).select("id").single();
  if (error || !job) return dbError(error);

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    body: JSON.stringify({ ref, inputs: { job_id: job.id } }),
  });
  if (!res.ok) {
    await service.from("backup_jobs").update({ status: "failed", error_message: `GitHub responded ${res.status}`, completed_at: new Date().toISOString() }).eq("id", job.id);
    return fail("BACKUP_DISPATCH_FAILED");
  }
  await writeAudit(staff, "backup.request", "backup", job.id as string);
  revalidatePath("/admin/backups");
  return { ok: true };
}
