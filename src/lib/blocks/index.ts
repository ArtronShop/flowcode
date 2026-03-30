export type { Port, CanvasBlock, Connection, BlockDef, BlockCategory, CodeGenContext, CodeResult, ChildRef, DataType, ParamDef, ParamOption, ParamText, ParamNumber } from './types.js';
export { paramDefault } from './types.js';
export { isCompatible, PORT_TYPE_COLORS } from './types.js';

export { triggerCategory } from './trigger.js';
export { ioCategory } from './io.js';
export { logicCategory } from './logic.js';
export { dataCategory } from './data.js';
export { actionCategory } from './action.js';

import { triggerCategory } from './trigger.js'; 
import { ioCategory } from './io.js';
import { logicCategory } from './logic.js';
import { dataCategory } from './data.js';
import { actionCategory } from './action.js';

export const blockCategories = [triggerCategory, ioCategory, logicCategory, dataCategory, actionCategory];

/** map จาก typeId → BlockDef สำหรับค้นหาเร็ว */
export const blockDefMap = Object.fromEntries(
	blockCategories.flatMap((c) => c.blocks).map((b) => [b.id, b])
);
