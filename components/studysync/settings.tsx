"use client";

import { useEffect, useState } from "react";
import { settingsStorageKey as storageKey, defaults, choices, parsePreferences, type Preferences } from "@/lib/study-preferences";

const sections: { title: string; rows: [keyof Preferences, string, string][] }[] = [
  { title: "General", rows: [["zone", "Time zone", "Time zone used to display your deadlines."], ["format", "Time format", "Choose how times appear in the planner."], ["week", "Week starts", "Controls how the timeline and calendar views begin."]] },
  { title: "Planning", rows: [["study", "Preferred study time", "When do you usually prefer to study?"], ["length", "Preferred session length", "Use this as a starting point, not a strict schedule."]] },
];

/** Standalone form: replace local demo persistence when the real Profile page is integrated. */
export function Settings() {
  const [saved, setSaved] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    // Read external browser storage after hydration; cancel if the host unmounts.
    const timer = setTimeout(() => {
    try {
      const valid = parsePreferences(localStorage.getItem(storageKey));
      setSaved(valid); setDraft(valid);
    } catch { setMessage("Demo storage is unavailable. You can still try the controls."); }
    setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  return <section className="settings-section" aria-labelledby="settings-title">
    <h2 id="settings-title" className="text-[22px] font-semibold">Settings</h2>
    <p className="mt-1 mb-6 text-sm">Personalize how StudySync works for you.</p>
    <p className="demo-note mb-5">Demo only: Save stores preferences in this browser. No database save. General and Planning preferences are saved for this preview; they do not yet change planner records.</p>
    <form className="surface space-y-5 p-6" onSubmit={event => {
      event.preventDefault();
      try { localStorage.setItem(storageKey, JSON.stringify(draft)); setSaved({ ...draft }); setMessage("✓ Your demo settings have been saved in this browser only."); }
      catch { setMessage("Could not save to browser storage. Your changes are still here; please try again."); }
    }}>
      {sections.map(section => <fieldset key={section.title} className="space-y-2.5" disabled={!ready}>
        <legend className="mb-3 text-lg font-semibold">{section.title}</legend>
        {section.rows.map(([key, title, hint]) => <div className="setting-row" key={key}>
          <div><p className="font-semibold" id={`label-${key}`}>{title}</p><p id={`hint-${key}`} className="mt-1 text-sm">{hint}</p></div>
          {["format", "week"].includes(key) ? <div className="segmented" role="group" aria-labelledby={`label-${key}`} aria-describedby={`hint-${key}`}>
            {choices[key].map(value => <button type="button" key={value} aria-pressed={draft[key] === value} onClick={() => { setDraft({ ...draft, [key]: value }); setMessage(""); }}>{value}</button>)}
          </div> : <select id={`setting-${key}`} aria-labelledby={`label-${key}`} aria-describedby={`hint-${key}`} value={draft[key]} onChange={event => { setDraft({ ...draft, [key]: event.target.value }); setMessage(""); }}>
            {choices[key].map(value => <option key={value}>{value}</option>)}
          </select>}
        </div>)}
      </fieldset>)}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ss-border)] pt-4">
        <p className="text-sm" role="status">{message || (dirty ? "Unsaved changes" : "No unsaved changes")}</p>
        <div className="flex gap-3"><button type="button" className="ss-button" disabled={!ready || !dirty} onClick={() => { setDraft({ ...saved }); setMessage("Changes canceled. Your last saved demo settings are restored."); }}>Cancel</button><button className="ss-button primary" disabled={!ready || !dirty} type="submit">Save changes</button></div>
      </div>
    </form>
  </section>;
}
