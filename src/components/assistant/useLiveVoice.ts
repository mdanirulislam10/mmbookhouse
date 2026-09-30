"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FunctionResponseScheduling, GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import type { ToolEffects } from "@/lib/assistant/tools";

export type VoiceState = "idle" | "connecting" | "live" | "reconnecting";

export interface VoiceCallbacks {
  onTranscript: (role: "user" | "model", text: string) => void;
  onTurnComplete: () => void;
  onEffects: (effects: ToolEffects) => void;
  onError: (code: "mic" | "camera" | "busy" | "connect") => void;
}

// Mic capture: downsample whatever the device rate is to 16 kHz mono PCM16, 100 ms chunks.
const WORKLET = `
class Capture extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.t = 0; this.acc = 0; this.n = 0; this.buf = new Int16Array(1600); this.i = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let k = 0; k < ch.length; k++) {
      this.acc += ch[k]; this.n++; this.t += 1;
      if (this.t >= this.ratio) {
        this.t -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.acc / this.n));
        this.buf[this.i++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        this.acc = 0; this.n = 0;
        if (this.i === this.buf.length) { this.port.postMessage(this.buf.buffer, [this.buf.buffer]); this.buf = new Int16Array(1600); this.i = 0; }
      }
    }
    return true;
  }
}
registerProcessor("mm-capture", Capture);
`;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64: string): Int16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

/** Talks to Gemini Live straight from the browser with a server-minted ephemeral token. */
export function useLiveVoice(cb: VoiceCallbacks) {
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState<"off" | "environment" | "user">("off");
  const videoRef = useRef<HTMLVideoElement>(null);

  const cbRef = useRef(cb);
  cbRef.current = cb;
  const session = useRef<Session | null>(null);
  const handle = useRef<string | undefined>(undefined);
  const stopping = useRef(false);
  const retries = useRef(0);
  const mutedRef = useRef(false);

  const micStream = useRef<MediaStream | null>(null);
  const micCtx = useRef<AudioContext | null>(null);
  const outCtx = useRef<AudioContext | null>(null);
  const playAt = useRef(0);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const camStream = useRef<MediaStream | null>(null);
  const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPlayback = useCallback(() => {
    for (const s of sources.current) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    sources.current.clear();
    playAt.current = 0;
  }, []);

  const play = useCallback((b64: string) => {
    const ctx = outCtx.current;
    if (!ctx) return;
    const pcm = fromBase64(b64);
    const buf = ctx.createBuffer(1, pcm.length, 24000);
    const data = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 0x8000;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const at = Math.max(ctx.currentTime + 0.02, playAt.current);
    src.start(at);
    playAt.current = at + buf.duration;
    sources.current.add(src);
    src.onended = () => sources.current.delete(src);
  }, []);

  const runTools = useCallback(async (calls: { id?: string; name?: string; args?: Record<string, unknown> }[]) => {
    for (const call of calls) {
      let result: Record<string, unknown> = { error: "TOOL_FAILED" };
      try {
        const res = await fetch("/api/assistant/tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: call.name, args: call.args ?? {} }),
        });
        const data = await res.json();
        result = data.result ?? result;
        if (data.effects) cbRef.current.onEffects(data.effects as ToolEffects);
      } catch {
        /* reported to the model as TOOL_FAILED */
      }
      session.current?.sendToolResponse({
        functionResponses: [{ id: call.id, name: call.name, response: result, scheduling: FunctionResponseScheduling.WHEN_IDLE }],
      });
    }
  }, []);

  const connect = useCallback(async () => {
    const res = await fetch("/api/assistant/live-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeHandle: handle.current }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error === "RATE_LIMITED" || data.error === "AI_BUSY" ? "busy" : "connect");

    const ai = new GoogleGenAI({ apiKey: data.token, httpOptions: { apiVersion: "v1alpha" } });
    session.current = await ai.live.connect({
      model: data.model,
      config: data.config,
      callbacks: {
        onmessage: (msg: LiveServerMessage) => {
          if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) handle.current = msg.sessionResumptionUpdate.newHandle;
          if (msg.goAway) void reconnect();
          if (msg.toolCall?.functionCalls?.length) void runTools(msg.toolCall.functionCalls);
          const sc = msg.serverContent;
          if (!sc) return;
          if (sc.interrupted) stopPlayback();
          for (const part of sc.modelTurn?.parts ?? []) {
            if (part.inlineData?.data && !part.thought) play(part.inlineData.data);
          }
          if (sc.inputTranscription?.text) cbRef.current.onTranscript("user", sc.inputTranscription.text);
          if (sc.outputTranscription?.text) cbRef.current.onTranscript("model", sc.outputTranscription.text);
          if (sc.turnComplete) cbRef.current.onTurnComplete();
        },
        onerror: () => {
          /* onclose follows */
        },
        onclose: () => {
          session.current = null;
          if (!stopping.current) void reconnect();
        },
      },
    });
    retries.current = 0;
    setState("live");
  }, [play, runTools, stopPlayback]); // eslint-disable-line react-hooks/exhaustive-deps

  const reconnect = useCallback(async () => {
    if (stopping.current) return;
    const old = session.current;
    session.current = null;
    try {
      old?.close();
    } catch {
      /* already closed */
    }
    if (retries.current++ >= 3) {
      cbRef.current.onError("connect");
      void stop(); // eslint-disable-line @typescript-eslint/no-use-before-define
      return;
    }
    setState("reconnecting");
    try {
      await connect();
    } catch {
      void reconnect();
    }
  }, [connect]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = useCallback(() => {
    if (frameTimer.current) clearInterval(frameTimer.current);
    frameTimer.current = null;
    camStream.current?.getTracks().forEach((t) => t.stop());
    camStream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera("off");
  }, []);

  const stop = useCallback(async () => {
    stopping.current = true;
    stopCamera();
    try {
      session.current?.close();
    } catch {
      /* ignore */
    }
    session.current = null;
    micStream.current?.getTracks().forEach((t) => t.stop());
    micStream.current = null;
    await micCtx.current?.close().catch(() => undefined);
    micCtx.current = null;
    stopPlayback();
    await outCtx.current?.close().catch(() => undefined);
    outCtx.current = null;
    handle.current = undefined;
    setState("idle");
  }, [stopCamera, stopPlayback]);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    stopping.current = false;
    retries.current = 0;
    setState("connecting");
    try {
      micStream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      setState("idle");
      cbRef.current.onError("mic");
      return;
    }
    try {
      outCtx.current = new AudioContext({ sampleRate: 24000 });
      micCtx.current = new AudioContext();
      const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      await micCtx.current.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const node = new AudioWorkletNode(micCtx.current, "mm-capture");
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (mutedRef.current || !session.current) return;
        session.current.sendRealtimeInput({ audio: { data: toBase64(e.data), mimeType: "audio/pcm;rate=16000" } });
      };
      micCtx.current.createMediaStreamSource(micStream.current).connect(node);
      await connect();
    } catch (e) {
      await stop();
      cbRef.current.onError(e instanceof Error && e.message === "busy" ? "busy" : "connect");
    }
  }, [state, connect, stop]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) session.current?.sendRealtimeInput({ audioStreamEnd: true });
  }, []);

  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      stopCamera();
      try {
        camStream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } } });
      } catch {
        cbRef.current.onError("camera");
        return;
      }
      setCamera(facing);
      requestAnimationFrame(() => {
        if (videoRef.current && camStream.current) {
          videoRef.current.srcObject = camStream.current;
          void videoRef.current.play().catch(() => undefined);
        }
      });
      const canvas = document.createElement("canvas");
      frameTimer.current = setInterval(() => {
        const v = videoRef.current;
        if (!v || !v.videoWidth || !session.current) return;
        const scale = Math.min(1, 768 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
        const jpeg = canvas.toDataURL("image/jpeg", 0.7);
        session.current.sendRealtimeInput({ video: { data: jpeg.slice(jpeg.indexOf(",") + 1), mimeType: "image/jpeg" } });
      }, 1000);
    },
    [stopCamera],
  );

  const toggleCamera = useCallback(() => (camera === "off" ? void startCamera("environment") : stopCamera()), [camera, startCamera, stopCamera]);
  const flipCamera = useCallback(() => void startCamera(camera === "user" ? "environment" : "user"), [camera, startCamera]);

  useEffect(() => () => void stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, start, stop, muted, toggleMute, camera, toggleCamera, flipCamera, videoRef };
}
