"use client";
import { useState } from "react";
import { useApp } from "../store/AppStore";

const DEPARTMENTS = ["Maintenance", "Operations", "Safety", "Inspection", "HSE", "Engineering", "Utilities", "Pipeline", "Logistics"];
const PERMIT_TYPES = ["Hot Work Permit", "Cold Work Permit", "Confined Space Entry", "Height Work Permit", "Excavation Permit", "Electrical Isolation"];

interface FormState {
  taskId: string;
  dept: string;
  area: string;
  type: string;
  shortDesc: string;
  details: string;
  assignee: string;
  validityStart: string;
  validityEnd: string;
}

const EMPTY: FormState = {
  taskId: "",
  dept: "",
  area: "",
  type: "",
  shortDesc: "",
  details: "",
  assignee: "",
  validityStart: "",
  validityEnd: "",
};

export default function NewTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask, pushToast, user, role, peekNextTaskId, tasks } = useApp();
  const [form, setForm] = useState<FormState>({ ...EMPTY, assignee: user });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  // Suggested next ID shown as a hint only — the operator types the Task ID
  // manually to match the paper-based workflow (never auto-assigned).
  const [suggestedId] = useState(() => peekNextTaskId());

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.taskId.trim()) {
      next.taskId = "Task ID is required — enter it as written on the paper form.";
    } else if (tasks.some((t) => t.id.toLowerCase() === form.taskId.trim().toLowerCase())) {
      next.taskId = "This Task ID already exists. Enter a unique ID.";
    }
    if (!form.dept) next.dept = "Department is required.";
    if (!form.area.trim()) next.area = "Area / unit is required.";
    if (!form.type) next.type = "Permit type is required.";
    if (!form.shortDesc.trim()) next.shortDesc = "A short description is required.";
    if (!form.assignee.trim()) next.assignee = "Assignee is required.";
    if (!form.validityStart) next.validityStart = "Start date is required.";
    if (!form.validityEnd) next.validityEnd = "End date is required.";
    if (form.validityStart && form.validityEnd && form.validityEnd < form.validityStart) {
      next.validityEnd = "End date cannot be before the start date.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const task = addTask({
      id: form.taskId.trim(),
      dept: form.dept,
      area: form.area.trim(),
      type: form.type,
      shortDesc: form.shortDesc.trim(),
      details: form.details.trim(),
      assignee: form.assignee.trim(),
      assigneeRole: role.charAt(0).toUpperCase() + role.slice(1),
      validityStart: form.validityStart,
      validityEnd: form.validityEnd,
    });
    pushToast(`Task ${task.id} created`);
    onClose();
  };

  const field = (key: keyof FormState, label: string, control: React.ReactNode) => (
    <div>
      <label className="field-label text-xs sm:text-sm font-semibold" htmlFor={`new-${key}`}>{label}</label>
      {control}
      {errors[key] && <div className="text-xs mt-1 font-medium" style={{ color: "#DC2626" }}>{errors[key]}</div>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New task"
    >
      <div
        className="w-full max-w-[580px] max-h-[92vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="text-base font-bold text-slate-900">Create New Task / Permit</div>
            <div className="text-xs text-slate-500">Permit-to-work registration form</div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              {field("taskId", "Task ID *", (
                <input
                  id="new-taskId"
                  value={form.taskId}
                  onChange={(e) => set("taskId", e.target.value)}
                  className="ctrl-input w-full"
                  placeholder={`e.g. ${suggestedId}`}
                  aria-label="Task ID, entered manually"
                  aria-describedby="new-taskid-hint"
                  autoComplete="off"
                />
              ))}
              {!errors.taskId && (
                <div id="new-taskid-hint" className="text-xs mt-1 text-slate-500">
                  Enter the ID from the paper form — next available: <strong className="text-slate-700">{suggestedId}</strong>
                </div>
              )}
            </div>

            <div className="col-span-1">
              {field("dept", "Department *", (
                <select id="new-dept" value={form.dept} onChange={(e) => set("dept", e.target.value)} className="ctrl-select w-full">
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ))}
            </div>

            <div className="col-span-1">
              {field("type", "Permit type *", (
                <select id="new-type" value={form.type} onChange={(e) => set("type", e.target.value)} className="ctrl-select w-full">
                  <option value="">Select permit type…</option>
                  {PERMIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ))}
            </div>

            <div className="col-span-1 sm:col-span-2">
              {field("area", "Area / Unit *", (
                <input id="new-area" value={form.area} onChange={(e) => set("area", e.target.value)} className="ctrl-input w-full" placeholder="e.g. Unit-3 Reformer / Crude Distillation" />
              ))}
            </div>

            <div className="col-span-1 sm:col-span-2">
              {field("shortDesc", "Short description *", (
                <input id="new-shortDesc" value={form.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} className="ctrl-input w-full" placeholder="Brief summary of the work" />
              ))}
            </div>

            {/* Requested Detailed Notes / Scope of Work Textarea */}
            <div className="col-span-1 sm:col-span-2">
              {field("details", "Detailed notes / Scope of work (Optional)", (
                <textarea
                  id="new-details"
                  value={form.details}
                  onChange={(e) => set("details", e.target.value)}
                  className="ctrl-input w-full text-xs sm:text-sm"
                  rows={3}
                  placeholder="Specific equipment tags, detailed work scope, safety precautions, or contractor remarks…"
                  style={{ resize: "vertical" }}
                />
              ))}
            </div>

            <div className="col-span-1 sm:col-span-2">
              {field("assignee", "Assignee *", (
                <input id="new-assignee" value={form.assignee} onChange={(e) => set("assignee", e.target.value)} className="ctrl-input w-full" placeholder="Operator or engineer name" />
              ))}
            </div>

            <div className="col-span-1">
              {field("validityStart", "Valid from *", (
                <input id="new-validityStart" type="date" value={form.validityStart} onChange={(e) => set("validityStart", e.target.value)} className="ctrl-input w-full" />
              ))}
            </div>

            <div className="col-span-1">
              {field("validityEnd", "Valid until *", (
                <input id="new-validityEnd" type="date" value={form.validityEnd} onChange={(e) => set("validityEnd", e.target.value)} className="ctrl-input w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            <svg className="w-3.5 h-3.5 -ml-0.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create task</span>
          </button>
        </div>
      </div>
    </div>
  );
}

