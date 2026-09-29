"use client";

export function RetryButton() {
  return (
    <button onClick={() => window.location.reload()} className="mt-6 rounded-md bg-brand-amber px-5 py-2 font-semibold text-brand-ink">
      আবার চেষ্টা করুন / Try again
    </button>
  );
}
