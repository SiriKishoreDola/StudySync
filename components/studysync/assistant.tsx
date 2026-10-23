"use client";

import { useEffect, useRef, useState } from "react";
import { suggestedPrompts } from "@/lib/study-demo";
import { readResponseLength, type ResponseLength } from "@/lib/study-preferences";

export type AssistantScenario = "normal" | "error" | "empty";
type Message = { role: "student" | "assistant"; text: string };

/** Local Gemini chat; scenario controls remain request-free UI fixtures. */
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
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const pending = useRef<Message[]>([]);
  const history = useRef<Message[]>([]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (open) close.current?.focus(); }, [open]);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [messages, state]);
  function dismiss() { setOpen(false); launcher.current?.focus(); }
  async function ask(question: string, retry = false) {
    const text = question.trim();
    if (!text || request.current) return;
    setLastQuestion(text); setInput(""); setError("");
    if (!retry) {
      pending.current = [...history.current.slice(-10), { role: "student", text }];
      setMessages(current => [...current, { role: "student", text }]);
    }
    setState("loading");
    close.current?.focus();
    if (scenario === "error") {
      setError("Simulated error fixture; no Gemini request was sent. Choose Live Gemini to try the connection.");
      setState("error"); return;
    }
    if (scenario === "empty") { setState("empty"); return; }
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      let responseLength: ResponseLength = "Concise";
      // Accessing localStorage itself can throw when browser storage is blocked.
      try { responseLength = readResponseLength(window.localStorage); } catch { /* Use Concise. */ }
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: pending.current, responseLength }), signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gemini is unavailable. Please retry.");
      if (typeof data.text !== "string" || !data.text.trim()) throw new Error("No response received. Please retry.");
      const answer: Message = { role: "assistant", text: data.text };
      history.current = [...pending.current, answer].slice(-10);
      setMessages(current => [...current, answer]); setState("conversation");
    } catch (error) {
      if (controller.signal.aborted) setError("The request timed out or was canceled. Retry when ready.");
      else setError(error instanceof Error ? error.message : "Connection failed. Please retry.");
      setState("error");
    } finally {
      clearTimeout(timeout);
      request.current = null;
    }
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
        <div><h2 id="assistant-title" className="text-lg font-semibold">Ask StudySync</h2><p className="mt-1 text-xs">Academic planning · Gemini · Local preview</p></div>
        <button ref={close} className="ss-button text-xs" onClick={dismiss} aria-label="Close assistant">× Close</button>
      </header>
      <div ref={scroller} className="assistant-messages" tabIndex={0} aria-label="Conversation, scroll for more messages">
        {state === "welcome" && <div className="space-y-6">
          <div><h3 className="text-2xl font-semibold">Let’s plan your week.</h3><p className="mt-3">Hi! I can help you review upcoming deadlines and decide what to start first.</p><p className="mt-3 text-sm">Gemini receives your messages and four fictional example deadlines for October 12–18, 2026. No real student records are connected. Ask about fictional examples or provide your own deadlines.</p></div>
          <div className="space-y-2.5"><h3 className="mb-3 text-xs font-semibold">SUGGESTED PROMPTS</h3>{suggestedPrompts.map(prompt => <button key={prompt} className="prompt-button" onClick={() => ask(prompt)}>{prompt}<span aria-hidden="true">↗</span></button>)}</div>
          <div className="surface p-4"><h3 className="font-semibold">You stay in control</h3><p className="mt-2">StudySync offers suggestions. It doesn’t create, move, or change calendar events.</p></div>
        </div>}
        <div role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions" className="space-y-6">{messages.map((message, index) => <div key={index} className={message.role === "student" ? "student-message" : ""}><p className="mb-2 text-xs">{message.role === "student" ? "You" : "StudySync · AI response"}</p><div className={`message-bubble ${message.role === "student" ? "student-bubble" : "surface"}`}>{message.text}</div></div>)}</div>
        {state === "loading" && <p role="status" className="surface mt-5 p-4">Asking Gemini…</p>}
        {state === "error" && <div role="alert" className="surface mt-5 p-4"><h3 className="font-semibold">Could not get a response</h3><p className="my-3">{error}</p><button className="ss-button primary" onClick={() => ask(lastQuestion, true)}>Retry</button><button className="ss-button ml-2" onClick={() => { setState("conversation"); setError(""); }}>Dismiss error</button></div>}
        {state === "empty" && <div role="status" className="surface mt-5 p-4"><h3 className="text-lg font-semibold">No deadlines to plan yet</h3><p className="mt-3">This empty demo has no course deadlines. In the full app, upload a syllabus to get started.</p></div>}
      </div>
      <form className="assistant-composer" onSubmit={event => { event.preventDefault(); ask(input); }}>
        <label htmlFor="assistant-message" className="text-xs">Message StudySync</label>
        <div className="mt-2 flex gap-2"><input id="assistant-message" maxLength={1000} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about your deadlines…" disabled={state === "loading" || state === "error"} autoComplete="off" /><button type="submit" className="ss-button primary" disabled={!input.trim() || state === "loading" || state === "error"}>Send</button></div>
        <p className="mt-3 text-[11px]">AI can make mistakes · Fictional demo context · No calendar changes</p>
      </form>
    </aside></>}
  </>;
}
