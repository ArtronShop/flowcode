import type { BoardItem } from './types.js'

// Bare board / Dev Kit
import esp32dev from './esp32dev.js';
import esp32s3dev from './esp32s3dev.js';
import esp32c3dev from './esp32c3dev.js';
import esp32c6dev from './esp32c6dev.js';
import esp32c5dev from './esp32c5dev.js';

// High Level board
import tinker_c6 from './tinker_c6.js';

const boards: BoardItem[] = [
    esp32dev,
    esp32s3dev,
    esp32c3dev,
    esp32c5dev,
    esp32c6dev,
    tinker_c6
];

export default boards;
