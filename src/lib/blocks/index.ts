export type { Port, CanvasBlock, Connection, BlockDef, BlockCategory, CodeGenContext, CodeResult, ChildRef, DataType, ParamDef, ParamOption, ParamText, ParamNumber } from './types.js';
export { paramDefault } from './types.js';
export { isCompatible, PORT_TYPE_COLORS } from './types.js';

export { triggerCategory } from './trigger.js';
export { ioCategory } from './io.js';
export { controlCategory } from './control.js';
export { dataCategory } from './data.js';
export { serialCategory } from './serial.js';
export { functionCategory } from './function.js';

import { triggerCategory } from './trigger.js'; 
import { ioCategory } from './io.js';
import { controlCategory } from './control.js';
import { dataCategory } from './data.js';
import { serialCategory } from './serial.js';
import { functionCategory } from './function.js';

export const blockCategories = [triggerCategory, ioCategory, controlCategory, dataCategory, serialCategory, functionCategory];

/** map จาก typeId → BlockDef สำหรับค้นหาเร็ว */
export const blockDefMap = Object.fromEntries(
	blockCategories.flatMap((c) => c.blocks).map((b) => [b.id, b])
);
