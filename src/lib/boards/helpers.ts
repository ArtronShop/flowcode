// ── Helpers ──────────────────────────────────────────────────────────────────

import type { BoardSetting, BoardSettingOption } from "./types";

/** option → inject id=value ลง fqbn */
export const opt = (label: string, value: string, _default?: boolean): BoardSettingOption =>
    (!_default) ? ({ label, value }) : ({ label, value, default: true });

/** สร้าง setting — id ใช้เป็นทั้ง setting id และ fqbn key */
export const setting = (id: string, label: string, options: BoardSettingOption[]): BoardSetting =>
    ({ id, label, options });

