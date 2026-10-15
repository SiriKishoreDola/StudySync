"use client";

import { useEffect, useRef, useState } from "react";
import { demoResponse, suggestedPrompts } from "@/lib/study-demo";

export type AssistantScenario = "normal" | "error" | "empty";
type Message = { role: "student" | "assistant"; text: string };

/** Preset responses only. Supply a real service at the integration boundary later. */
export function Assistant({ scenario = "normal" }: { scenario?: AssistantScenario }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<"welcome" | "loading" | "conversation" | "error" | "empty">("welcome");
  const [lastQuestion, setLastQuestion] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (open) close.current?.focus(); }, [open]);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [messages, state]);
  function dismiss() { setOpen(false); launcher.current?.focus(); }
  function ask(question: string, retry = false) {
    if (!question.trim() || state === "loading") return;
    setLastQuestion(question); setInput("");
    if (!retry) setMessages(current => [...current, { role: "student", text: question }]);
    setState("loading");
    // Suggested prompts and Retry disappear while loading; keep focus in the dialog.
    close.current?.focus();
    timer.current = setTimeout(() => {
      if (scenario === "error" && !retry) { setState("error"); return; }
      if (scenario === "empty") { setState("empty"); return; }
      setMessages(current => [...current, { role: "assistant", text: demoResponse(question) }]); setState("conversation");
    }, 900);
  }
  return <>
    <button ref={launcher} className="ss-button primary assistant-launcher" aria-expanded={open} aria-controls="study-assistant" onClick={() => { setOpen(true); if (!messages.length && scenario === "empty") setState("empty"); }}>Ask StudySync <span aria-hidden="true">↗</span></button>
    {open && <><div className="assistant-backdrop" onClick={dismiss} aria-hidden="true" /><aside ref={panel} id="study-assistant" className="assistant-panel" role="dialog" aria-modal="true" aria-labelledby="assistant-title" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); dismiss(); }
      if (event.key === "Tab") {
        const focusable = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--ss-border)] p-6">
        <div><h2 id="assistant-title" className="text-lg font-semibold">Ask StudySync</h2><p className="mt-1 text-xs">Academic planning · Simulated demo</p></div>
        <button ref={close} className="ss-button text-xs" onClick={dismiss} aria-label="Close assistant">× Close</button>
      </header>
      <div ref={scroller} className="assistant-messages" tabIndex={0} aria-label="Conversation, scroll for more messages">
        {state === "welcome" && <div className="space-y-6">
          <div><h3 className="text-2xl font-semibold">Let’s plan your week.</h3><p className="mt-3">Hi! I can help you review upcoming deadlines and decide what to start first.</p><p className="mt-3 text-sm">This demo uses four fictional course deadlines for October 12–18, 2026. Responses are preset, not real AI.</p></div>
          <div className="space-y-2.5"><h3 className="mb-3 text-xs font-semibold">SUGGESTED PROMPTS</h3>{suggestedPrompts.map(prompt => <button key={prompt} className="prompt-button" onClick={() => ask(prompt)}>{prompt}<span aria-hidden="true">↗</span></button>)}</div>
          <div className="surface p-4"><h3 className="font-semibold">You stay in control</h3><p className="mt-2">StudySync offers suggestions. It doesn’t create, move, or change calendar events.</p></div>
        </div>}
        <div role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions" className="space-y-6">{messages.map((message, index) => <div key={index} className={message.role === "student" ? "student-message" : ""}><p className="mb-2 text-xs">{message.role === "student" ? "You" : "StudySync · Simulated response"}</p><div className={`message-bubble ${message.role === "student" ? "student-bubble" : "surface"}`}>{message.text}</div></div>)}</div>
        {state === "loading" && <p role="status" className="surface mt-5 p-4">Preparing a simulated study plan…</p>}
        {state === "error" && <div role="alert" className="surface mt-5 p-4"><h3 className="font-semibold">Demo connection interrupted</h3><p className="my-3">This is a simulated error. Your question is preserved. Retry to show the preset response.</p><button className="ss-button primary" onClick={() => ask(lastQuestion, true)}>Retry</button></div>}
        {state === "empty" && <div role="status" className="surface mt-5 p-4"><h3 className="text-lg font-semibold">No deadlines to plan yet</h3><p className="mt-3">This empty demo has no course deadlines. In the full app, upload a syllabus to get started.</p></div>}
      </div>
      <form className="assistant-composer" onSubmit={event => { event.preventDefault(); ask(input); }}>
        <label htmlFor="assistant-message" className="text-xs">Message StudySync</label>
        <div className="mt-2 flex gap-2"><input id="assistant-message" maxLength={1000} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about your deadlines…" disabled={state === "loading"} autoComplete="off" /><button type="submit" className="ss-button primary" disabled={!input.trim() || state === "loading"}>Send</button></div>
        <p className="mt-3 text-[11px]">Preset demo responses · No calendar changes</p>
      </form>
    </aside></>}
  </>;
}
