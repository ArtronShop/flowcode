export type Port = {
	id: string;
	type: 'input' | 'output';
	label: string;
};

export type CanvasBlock = {
	id: string;
	typeId: string;
	name: string;
	color: string;
	icon: string;
	x: number;
	y: number;
	inputs: Port[];
	outputs: Port[];
};

export type Connection = {
	id: string;
	fromBlockId: string;
	fromPortId: string;
	toBlockId: string;
	toPortId: string;
};

/** อ้างอิง output port ที่ต้องการให้ traverse ต่อ */
export type ChildRef = {
	portId: string;
	/** ความลึกสัมพัทธ์เทียบกับบล็อกปัจจุบัน (+1 = เยื้องเข้า, 0 = ระดับเดิม) */
	depthDelta: number;
};

/**
 * ผลลัพธ์จาก toCode() — สลับระหว่างบรรทัดโค้ดกับจุดที่ต้อง traverse ต่อ
 * traversal engine จะอ่าน parts ตามลำดับ:
 *   - string[] → push ลง output
 *   - ChildRef  → หา connection แล้ว traverse ต่อ
 */
export type CodeResult = {
	parts: Array<string[] | ChildRef>;
};

/** Context ที่ส่งให้ toCode() — เฉพาะสิ่งที่บล็อกต้องการสร้างโค้ดของตัวเอง */
export type CodeGenContext = {
	block: CanvasBlock;
	depth: number;
	pad: string;
	safeId: (id: string) => string;
};

export type BlockDef = {
	id: string;
	name: string;
	color: string;
	icon: string;
	category: string;
	inputs: Port[];
	outputs: Port[];
	/**
	 * สร้างโค้ดสำหรับบล็อกนี้
	 * @throws เมื่อสร้างโค้ดไม่ได้ (เช่น ข้อมูลไม่ครบ)
	 */
	toCode: (ctx: CodeGenContext) => CodeResult;
};

export type BlockCategory = {
	name: string;
	blocks: BlockDef[];
};
