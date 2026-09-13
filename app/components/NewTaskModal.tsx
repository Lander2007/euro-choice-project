"use client";
import { useState } from "react";
import { TODAY, useApp } from "../store/AppStore";

const DEPARTMENTS = ["Maintenance", "Operations", "Safety", "Inspection", "HSE", "Engineering", "Utilities", "Pipeline", "Logistics"];
const PERMIT_TYPES = ["Hot Work Permit", "Cold Work Permit", "Confined Space Entry", "Height Work Permit", "Excavation Permit", "Electrical Isolation"];

interface FormState {
  dept: string;
  area: string;
  type: string;
  shortDesc: string;
  assignee: string;
  validityStart: string;
  validityEnd: string;
}

const EMPTY: FormState = {
  dept: "",
  area: "",
  type: "",
  shortDesc: "",
  assignee: "",
  validityStart: TODAY,
  validityEnd: TODAY,
};

export default function NewTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask, pushToast, user, role, peekNextTaskId } = useApp();
  const [form, setForm] = useState<FormState>({ ...EMPTY, assignee: user });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  // ID preview is fixed when the modal opens so it stays stable while filling the form.
  const [previewId] = useState(() => peekNextTaskId());

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
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
      dept: form.dept,
      area: form.area.trim(),
      type: form.type,
      shortDesc: form.shortDesc.trim(),
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
      <label className="field-label" htmlFor={`new-${key}`}>{label}</label>
      {control}
      {errors[key] && <div className="text-xs mt-1 font-medium" style={{ color: "#D64545" }}>{errors[key]}</div>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(17, 24, 39, 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New task"
    >
      <div
        className="w-full mx-4 p-6 overflow-auto"
        style={{ maxWidth: 560, maxHeight: "90vh", background: "var(--surface)", borderRadius: 8, boxShadow: "0 12px 40px rgba(17,24,39,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>New task</div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 18, lineHeight: 1 }} aria-label="Close">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="col-span-2">
            <label className="field-label" htmlFor="new-task-id">Task ID</label>
            <input
              id="new-task-id"
              value={previewId}
              disabled
              readOnly
              className="ctrl-input w-full"
              aria-label="Task ID, auto-assigned and read-only"
              style={{ background: "var(--sunken)", cursor: "not-allowed" }}
            />
          </div>
          <div className="col-span-1">
            {field("dept", "Department *", (
              <select id="new-dept" value={form.dept} onChange={(e) => set("dept", e.target.value)} className="ctrl-select w-full">
                <option value="">Select…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ))}
          </div>
          <div className="col-span-1">
            {field("type", "Permit type *", (
              <select id="new-type" value={form.type} onChange={(e) => set("type", e.target.value)} className="ctrl-select w-full">
                <option value="">Select…</option>
                {PERMIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ))}
          </div>
          <div className="col-span-2">
            {field("area", "Area / unit *", (
              <input id="new-area" value={form.area} onChange={(e) => set("area", e.target.value)} className="ctrl-input w-full" placeholder="e.g. Unit-3 Reformer" />
            ))}
          </div>
          <div className="col-span-2">
            {field("shortDesc", "Short description *", (
              <input id="new-shortDesc" value={form.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} className="ctrl-input w-full" placeholder="Brief summary of the work" />
            ))}
          </div>
          <div className="col-span-2">
            {field("assignee", "Assignee *", (
              <input id="new-assignee" value={form.assignee} onChange={(e) => set("assignee", e.target.value)} className="ctrl-input w-full" placeholder="Operator name" />
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

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Create task</button>
        </div>
      </div>
    </div>
  );
}
