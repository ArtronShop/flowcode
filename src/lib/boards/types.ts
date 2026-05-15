import type { BlockCategory } from '$lib/blocks/types.js';

/** ตัวเลือกหนึ่งใน BoardSetting */
export type BoardSettingOption = {
    label: string;
    /** ค่าที่ inject เข้า fqbn เช่น "cdc", "error"
     *  ถ้า option นี้เป็น default ให้ใส่ default: true
     *  แล้วค่า value จะไม่ถูก inject */
    value: string;
    /** ถ้า true = option นี้เป็น default → ไม่ inject param นี้ลง fqbn */
    default?: boolean;
};

/** การตั้งค่าที่ผู้ใช้ปรับได้
 *  id ใช้เป็นทั้ง setting id และ fqbn key */
export type BoardSetting = {
    id: string;   // ← ใช้เป็น fqbn key ด้วย
    label: string;
    options: BoardSettingOption[];
};

export type BoardItem = {
    id: string;
    name: string;
    image: string;
    fqbn: string;
    platform: {
        id: string;
        version: string;
        package: string; // Package index URL (.json)
    };
    depends?: string[];
    /** การตั้งค่าที่ผู้ใช้ปรับได้ (ถ้ามี) */
    settings?: BoardSetting[];
    blocks: BlockCategory[];
};
