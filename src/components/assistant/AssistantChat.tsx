"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Camera, Loader2, MessageCircle, Mic, MicOff, PhoneOff, RotateCcw, Send, SwitchCamera, Video, VideoOff, X } from "lucide-react";
import { useLiveVoice } from "@/components/assistant/useLiveVoice";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { BookCover } from "@/components/ui/BookCover";
import { confirmAssistantOrder } from "@/app/actions/assistant";
import { cn, formatINR } from "@/lib/utils";
import type { BookCardOut, OrderProposal, ToolEffects } from "@/lib/assistant/tools";

interface Msg {
  role: "user" | "model";
  text: string;
  image?: string; // data URL preview (not stored)
  books?: BookCardOut[];
  proposal?: OrderProposal & { state: "open" | "placing" | "done" };
  error?: boolean;
}

const STORE_KEY = "mm_assistant_chat";

function load(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Msg[]) : [];
  } catch {
    return [];
  }
}

function save(msgs: Msg[]) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-40).map(({ image: _image, ...m }) => m)));
  } catch {
    /* storage unavailable */
  }
}

/** Shrinks a photo to at most 1024px JPEG so uploads stay small. */
async function toJpeg(file: File): Promise<{ dataUrl: string; base64: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return { dataUrl, base64: dataUrl.slice(dataUrl.indexOf(",") + 1) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Minimal rendering of the model's markdown: paragraphs, bullet lines and **bold**. */
function RichText({ text }: { text: string }) {
  const inline = (s: string): ReactNode[] => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part));
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        if (bullet) return <p key={i} className="pl-3 before:-ml-3 before:mr-1.5 before:content-['•']">{inline(bullet[1])}</p>;
        return line.trim() ? <p key={i}>{inline(line)}</p> : null;
      })}
    </div>
  );
}

export function AssistantChat({ signedIn }: { signedIn: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [photo, setPhoto] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Index of the message a live transcript is being appended to, per speaker.
  const liveTurn = useRef<{ user: number | null; model: number | null }>({ user: null, model: null });

  const applyEffects = (fx: ToolEffects) => {
    if (fx.cartChanged) router.refresh();
    if (fx.books?.length || fx.proposal) {
      setMsgs((m) => [...m, { role: "model", text: "", books: fx.books?.length ? fx.books : undefined, proposal: fx.proposal ? { ...fx.proposal, state: "open" } : undefined }]);
      liveTurn.current.model = null;
    }
  };

  const voice = useLiveVoice({
    onTranscript: (role, text) =>
      setMsgs((m) => {
        const idx = liveTurn.current[role];
        if (idx !== null && m[idx]?.role === role) return m.map((x, i) => (i === idx ? { ...x, text: x.text + text } : x));
        liveTurn.current[role] = m.length;
        if (role === "model") liveTurn.current.user = null;
        return [...m, { role, text: text.trimStart() }];
      }),
    onTurnComplete: () => {
      liveTurn.current = { user: null, model: null };
    },
    onEffects: applyEffects,
    onError: (code) =>
      setMsgs((m) => [
        ...m,
        { role: "model", text: t(code === "mic" ? "ai.errMic" : code === "camera" ? "ai.errCamera" : code === "busy" ? "ai.errBusy" : "ai.errVoice"), error: true },
      ]),
  });
  const live = voice.state !== "idle";

  useEffect(() => setMsgs(load()), []);
  useEffect(() => {
    save(msgs);
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  if (pathname.startsWith("/checkout")) return null;

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await toJpeg(file));
    } catch {
      setMsgs((m) => [...m, { role: "model", text: t("ai.errPhoto"), error: true }]);
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !photo) || busy) return;
    const history = msgs.filter((m) => !m.error && m.text).map((m) => ({ role: m.role, text: m.text }));
    const sentPhoto = photo;
    setMsgs((m) => [...m, { role: "user", text, image: sentPhoto?.dataUrl }]);
    setInput("");
    setPhoto(null);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, image: sentPhoto ? { mimeType: "image/jpeg", data: sentPhoto.base64 } : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const busyErr = data.error === "AI_BUSY" || data.error === "RATE_LIMITED";
        setMsgs((m) => [...m, { role: "model", text: t(busyErr ? "ai.errBusy" : "ai.errGeneric"), error: true }]);
        return;
      }
      if (data.cartChanged) router.refresh();
      setMsgs((m) => [
        ...m,
        {
          role: "model",
          text: data.reply || (data.books?.length ? "" : t("ai.errGeneric")),
          books: data.books?.length ? data.books : undefined,
          proposal: data.proposal ? { ...data.proposal, state: "open" } : undefined,
        },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "model", text: t("ai.errGeneric"), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function setProposalState(index: number, state: "open" | "placing" | "done") {
    setMsgs((m) => m.map((x, i) => (i === index && x.proposal ? { ...x, proposal: { ...x.proposal, state } } : x)));
  }

  async function confirm(index: number, p: OrderProposal) {
    setProposalState(index, "placing");
    const total = p.subtotal + (p.deliveryFee ?? 0);
    const r = await confirmAssistantOrder({ fulfillment: p.fulfillment, addressId: p.addressId, expectedTotal: total });
    setProposalState(index, "done");
    if (r.ok && r.data) {
      router.refresh();
      setMsgs((m) => [...m, { role: "model", text: t("ai.orderPlaced", { no: r.data!.orderNo, total: r.data!.total }) }]);
    } else {
      const reason = !r.ok && r.error === "CART_CHANGED" ? t("ai.cartChanged") : t("ai.orderFailed", { reason: errorMessage(lang, r.ok ? undefined : r.error) });
      setMsgs((m) => [...m, { role: "model", text: reason, error: true }]);
    }
  }

  function cancel(index: number) {
    setProposalState(index, "done");
    setMsgs((m) => [...m, { role: "model", text: t("ai.orderCancelled") }]);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("ai.open")}
        title={t("ai.open")}
        className="no-print fixed bottom-[5.5rem] right-3 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-white shadow-lg ring-4 ring-white transition hover:scale-105 md:bottom-6 md:right-6"
      >
        <MessageCircle size={26} />
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={t("ai.title")}
      className="no-print fixed inset-x-0 bottom-0 top-[8vh] z-50 flex flex-col overflow-hidden rounded-t-2xl border bg-white shadow-2xl md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:h-[min(640px,85vh)] md:w-[400px] md:rounded-2xl"
    >
      <header className="flex items-center gap-3 bg-brand-navy px-4 py-3 text-white">
        <Bot size={22} className="shrink-0 text-brand-amber" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold leading-tight">{t("ai.title")}</h2>
          <p className="truncate text-xs text-slate-300">{t("ai.subtitle")}</p>
        </div>
        {msgs.length > 0 && (
          <button type="button" onClick={() => setMsgs([])} aria-label={t("ai.clear")} title={t("ai.clear")} className="rounded p-1.5 hover:bg-white/10">
            <RotateCcw size={18} />
          </button>
        )}
        <button type="button" onClick={() => (void voice.stop(), setOpen(false))} aria-label={t("ai.close")} className="rounded p-1.5 hover:bg-white/10">
          <X size={20} />
        </button>
      </header>

      {live && (
        <div className="border-b bg-emerald-50 px-3 py-2">
          {voice.camera !== "off" && <video ref={voice.videoRef} muted playsInline className="mb-2 max-h-48 w-full rounded-lg bg-black object-contain" />}
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", voice.state === "live" ? "animate-pulse bg-emerald-500" : "bg-amber-500")} />
            <span className="flex-1 text-sm text-emerald-900">
              {voice.state === "live" ? t(voice.muted ? "ai.voiceMuted" : "ai.voiceListening") : t(voice.state === "connecting" ? "ai.voiceConnecting" : "ai.voiceReconnecting")}
            </span>
            <button type="button" onClick={voice.toggleMute} aria-label={t(voice.muted ? "ai.unmute" : "ai.mute")} title={t(voice.muted ? "ai.unmute" : "ai.mute")} className="rounded-full bg-white p-2 shadow-sm">
              {voice.muted ? <MicOff size={18} className="text-red-600" /> : <Mic size={18} />}
            </button>
            <button
              type="button"
              onClick={voice.toggleCamera}
              aria-label={t(voice.camera === "off" ? "ai.cameraOn" : "ai.cameraOff")}
              title={t(voice.camera === "off" ? "ai.cameraOn" : "ai.cameraOff")}
              className="rounded-full bg-white p-2 shadow-sm"
            >
              {voice.camera === "off" ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            {voice.camera !== "off" && (
              <button type="button" onClick={voice.flipCamera} aria-label={t("ai.flipCamera")} title={t("ai.flipCamera")} className="rounded-full bg-white p-2 shadow-sm">
                <SwitchCamera size={18} />
              </button>
            )}
            <button type="button" onClick={() => void voice.stop()} aria-label={t("ai.voiceEnd")} title={t("ai.voiceEnd")} className="rounded-full bg-red-600 p-2 text-white shadow-sm">
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      )}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 text-sm">
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
          {t("ai.intro")}
          {!signedIn && (
            <p className="mt-1 text-xs text-slate-500">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="text-brand-navy underline">
                {t("ai.loginHint")}
              </Link>
            </p>
          )}
        </div>

        {msgs.map((m, i) => (
          <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
            {m.image && <img src={m.image} alt="" className="max-h-40 rounded-xl border object-contain" />}
            {m.text && (
              <div
                className={cn(
                  "max-w-[88%] break-words rounded-2xl px-3 py-2 shadow-sm",
                  m.role === "user" ? "rounded-tr-sm bg-brand-navy text-white" : "rounded-tl-sm bg-white",
                  m.error && "border border-red-200 bg-red-50 text-red-700",
                )}
              >
                {m.role === "model" ? <RichText text={m.text} /> : <p className="whitespace-pre-wrap">{m.text}</p>}
              </div>
            )}
            {m.books && (
              <div className="flex w-full gap-2 overflow-x-auto pb-1">
                {m.books.map((b) => (
                  <Link key={b.book_id} href={`/book/${b.slug}`} className="w-28 shrink-0 rounded-xl border bg-white p-2 hover:shadow">
                    <BookCover src={b.cover_url} title={b.title} sizes="112px" />
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug">{b.title}</p>
                    <p className="mt-0.5 text-xs">
                      <b>{formatINR(b.price)}</b>
                      {b.mrp > b.price && <s className="ml-1 text-slate-400">{formatINR(b.mrp)}</s>}
                    </p>
                    {!b.in_stock && <p className="text-[11px] text-red-600">{t("ai.outOfStock")}</p>}
                  </Link>
                ))}
              </div>
            )}
            {m.proposal && (
              <div className="w-full rounded-xl border-2 border-emerald-500 bg-white p-3">
                <p className="font-semibold">{t("ai.confirmTitle")}</p>
                <p className="text-xs text-slate-600">{m.proposal.fulfillment === "pickup" ? t("ai.confirmPickup") : t("ai.confirmCod")}</p>
                {m.proposal.addressText && <p className="mt-1 text-xs text-slate-600">{m.proposal.addressText}</p>}
                <ul className="mt-2 space-y-0.5 text-xs">
                  {m.proposal.items.map((it, j) => (
                    <li key={j} className="flex justify-between gap-2">
                      <span className="line-clamp-1">
                        {it.title} × {it.qty}
                      </span>
                      <span>{formatINR(it.price * it.qty)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between text-slate-600">
                    <span>{t("ai.deliveryFee")}</span>
                    <span>{m.proposal.deliveryFee ? formatINR(m.proposal.deliveryFee) : t("ai.free")}</span>
                  </li>
                  <li className="flex justify-between border-t pt-1 font-semibold">
                    <span>{t("ai.total")}</span>
                    <span>{formatINR(m.proposal.subtotal + (m.proposal.deliveryFee ?? 0))}</span>
                  </li>
                </ul>
                {m.proposal.state !== "done" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={m.proposal.state === "placing"}
                      onClick={() => confirm(i, m.proposal!)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {m.proposal.state === "placing" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> {t("ai.placing")}
                        </>
                      ) : (
                        t("ai.placeOrder")
                      )}
                    </button>
                    <button type="button" disabled={m.proposal.state === "placing"} onClick={() => cancel(i)} className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                      {t("ai.cancel")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" /> {t("ai.thinking")}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="border-t bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {photo && (
          <div className="mb-2 flex items-center gap-2">
            <img src={photo.dataUrl} alt="" className="h-14 rounded border object-contain" />
            <button type="button" onClick={() => setPhoto(null)} className="text-xs text-red-600 underline">
              {t("ai.removePhoto")}
            </button>
          </div>
        )}
        <div className="flex items-end gap-1">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => (void pickPhoto(e.target.files?.[0]), (e.target.value = ""))} />
          <button type="button" onClick={() => fileRef.current?.click()} aria-label={t("ai.photo")} title={t("ai.photo")} className="rounded-full p-2.5 text-slate-600 hover:bg-slate-100">
            <Camera size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={t("ai.placeholder")}
            className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border px-3 py-2.5 text-sm focus:border-brand-navy focus:outline-none"
          />
          {input.trim() || photo ? (
            <button type="submit" disabled={busy} aria-label={t("ai.send")} className="rounded-full bg-brand-navy p-2.5 text-white disabled:opacity-40">
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void (live ? voice.stop() : voice.start())}
              aria-label={t(live ? "ai.voiceEnd" : "ai.voiceStart")}
              title={t(live ? "ai.voiceEnd" : "ai.voiceStart")}
              className={cn("rounded-full p-2.5 text-white", live ? "bg-red-600" : "bg-emerald-600")}
            >
              {live ? <PhoneOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
