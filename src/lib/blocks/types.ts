// ─── Arduino-compatible data types ──────────────────────────────────────────

export type DataType =
	| 'void'    // control flow — ไม่มีค่าข้อมูล
	| 'bool'    // boolean (true/false)
	| 'byte'    // uint8_t, 0–255
	| 'char'    // อักขระ 1 ตัว
	| 'int'     // 16-bit signed integer
	| 'long'    // 32-bit signed integer
	| 'float'   // 32-bit floating point
	| 'double'  // 64-bit floating point (= float บน AVR Arduino)
	| 'String'  // Arduino String class
	| 'any'
	| string;    // รับได้ทุก type (generic / utility blocks)

/**
 * ตรวจสอบว่า output type `from` สามารถต่อเข้า input type `to` ได้หรือไม่
 * กฎ: widening numeric, char→String, any←→*, void เฉพาะ void เท่านั้น
 */
export function isCompatible(from: DataType, to: DataType): boolean {
	if (from === to) return true;
	if (from === 'any' || to === 'any') return true;

	// Numeric widening: byte ⊆ int ⊆ long ⊆ float ⊆ double
	const numeric: DataType[] = ['byte', 'int', 'long', 'float', 'double'];
	const fi = numeric.indexOf(from);
	const ti = numeric.indexOf(to);
	if (fi !== -1 && ti !== -1 && fi <= ti) return true;

	// bool → numeric
	if (from === 'bool' && ti !== -1) return true;

	// char → String
	if (from === 'char' && to === 'String') return true;

	return false;
}

/** สีประจำ type สำหรับแสดงบน port */
export const PORT_TYPE_COLORS: Record<DataType, string> = {
	void:   '#6b7280', // gray     — control flow
	bool:   '#f59e0b', // amber
	byte:   '#10b981', // emerald
	char:   '#f97316', // orange
	int:    '#3b82f6', // blue
	long:   '#6366f1', // indigo
	float:  '#8b5cf6', // violet
	double: '#a855f7', // purple
	String: '#ef4444', // red
	any:    '#94a3b8', // slate    — generic
	json:   '#22d3ee', // cyan     — ArduinoJson document/variant
};

// ─── Canvas / Connection types ───────────────────────────────────────────────

export type Port = {
	id: string;
	type: 'input' | 'output';
	label: string;
	dataType: DataType;
	description?: string;
};

export type CanvasBlock = {
	id: string;
	typeId: string;
	trigger: boolean;
	name: string;
	color: string;
	icon: string;
	x: number;
	y: number;
	inputs: Port[];
	outputs: Port[];
	/** ค่าที่ผู้ใช้แก้ไขได้บนบล็อก เช่น { value: '42' } */
	params: Record<string, string>;
	note: string;
};

export type Connection = {
	id: string;
	fromBlockId: string;
	fromPortId: string;
	toBlockId: string;
	toPortId: string;
};

// ─── Code generation types ───────────────────────────────────────────────────

/** อ้างอิง output port ที่ต้องการให้ traverse ต่อ */
export type ChildRef =
	| {
		portId: string;
		/** ความลึกสัมพัทธ์เทียบกับบล็อกปัจจุบัน (+1 = เยื้องเข้า, 0 = ระดับเดิม) */
		depthDelta: number;
	}
	| {
		/**
		 * traverse blocks ที่ต่อเข้า INPUT port นี้ของบล็อกปัจจุบัน ก่อนดำเนินการต่อ
		 * ใช้สำหรับ "Wait All" block — รับรองว่าทุก branch ทำงานก่อน output
		 */
		waitPortId: string;
	};

/**
 * ผลลัพธ์จาก toCode() — สลับระหว่างบรรทัดโค้ดกับจุดที่ต้อง traverse ต่อ
 *   - string[] → push ลง output
 *   - ChildRef  → หา connection แล้ว traverse ต่อ (inline)
 */
export type CodeResult = {
	parts: Array<string[] | ChildRef>;
};

/** Context ที่ส่งให้ toCode() */
export type CodeGenContext = {
	block: CanvasBlock;
	/** ค่า params ของบล็อกนี้ keyed by param id — เข้าถึงได้เลย เช่น params.value */
	params: Record<string, string>;
	depth: number;
	pad: string;
	safeId: (id: string) => string;
	/**
	 * traverse blocks ที่ต่อออกจาก portId แล้วคืนเป็น string
	 * ใช้สำหรับฝัง code ไว้ใน if / for / callback / function body
	 * @param portId  output port ของบล็อกนี้ที่จะ traverse
	 * @param baseDepth  indent level เริ่มต้น (default: depth + 1)
	 */
	captureCode: (portId: string, baseDepth?: number) => string;
	/**
	 * ลงทะเบียน C function แยก — จะถูก emit ท้ายไฟล์
	 * @param header       เช่น "void myFn(void* pvParameters)"
	 * @param body         code ที่จะอยู่ใน { } (ได้จาก captureCode หรือสร้างเอง)
	 * @param declaration  forward declaration (optional) จะถูก emit ก่อน setup()
	 */
	registerFunction: (header: string, body: string, declaration?: string) => void;
	/**
	 * ลงทะเบียน preprocessor directive — emit บนสุดของไฟล์ (dedup อัตโนมัติ)
	 * เช่น '#include <Wire.h>' หรือ '#define LED_PIN 2'
	 */
	registerPreprocessor: (directive: string) => void;
	/**
	 * ลงทะเบียน global variable — emit ก่อน setup()
	 * เช่น 'int counter = 0;'
	 */
	registerGlobal: (declaration: string) => void;
	/**
	 * ลงทะเบียน polling code — ใส่ลง loop()
	 * เช่น 'int counter = 0;'
	 */
	registerPollingCode: (code: string) => void;
	/**
	 * คืนชื่อ variable / expression ของบล็อกที่ต่อเข้ามาทาง input port นี้
	 * ถ้าไม่มีการต่อเส้น จะ throw เพื่อให้ toCode() จัดการ fallback เอง
	 */
	resolveInput: (portId: string) => string | null;
};

type HiddenFn = (args: { params: Record<string, string> }) => boolean;

type ParamBase = {
	id: string;
	label?: string;
	description?: string;
	default?: string;
	hidden?: boolean | HiddenFn;
};

export type ParamOption = ParamBase & {
	type: 'option';
	options: { label: string; value: string; description?: string; }[];
};

export type ParamText = ParamBase & {
	type: 'text';
	validation?: (text: string) => string;
};

export type ParamNumber = ParamBase & {
	type: 'number';
	validation?: (n: number) => number;
};

/** param ที่เลือก variable name จากฐานข้อมูล varname registry */
export type ParamVarname = ParamBase & {
	type: 'varname';
	/** กลุ่มของ varname เช่น 'http', 'tcp', 'udp', 'file' */
	category: string;
};

export type ParamDef = ParamOption | ParamText | ParamNumber | ParamVarname;

/** helper: คืนค่า default ของ param */
export function paramDefault(p: ParamDef): string {
	if (p.type === 'option') return p.default ?? p.options[0]?.value ?? '';
	return p.default ?? (p.type === 'number' ? '0' : '');
}

export type BlockDef = {
	id: string;
	trigger?: boolean;
	name: string;
	color: string;
	icon: string;
	category: string;
	description?: string;
	inputs: Port[];
	outputs: Port[];
	/** พารามิเตอร์ที่แก้ไขได้บนบล็อก (array, keyed by id) */
	params?: ParamDef[];
	/**
	 * ถ้ามี toExpr: resolveInput จะ return ค่า expression โดยตรง (ไม่ declare variable)
	 * รับ params object ที่ keyed by id — เข้าถึงได้เลย เช่น params.value, params.OK
	 */
	toExpr?: (params: Record<string, string>) => string;
	/**
	 * ถ้ากำหนด: คืน inputs/outputs ใหม่ตาม params ปัจจุบัน
	 * เรียกทุกครั้งที่ param เปลี่ยน — connection ที่ชี้ไป port ที่หายไปจะถูกลบอัตโนมัติ
	 */
	dynamicPorts?: (params: Record<string, string>) => { inputs?: Port[]; outputs?: Port[]; };
	/**
	 * สร้างโค้ดสำหรับบล็อกนี้
	 * @throws เมื่อสร้างโค้ดไม่ได้ (เช่น ข้อมูลไม่ครบ)
	 */
	toCode: (ctx: CodeGenContext) => CodeResult;
};

export type BlockCategory = {
	id?: string; // Request for extension
	name: string;
	blocks: BlockDef[];
};
