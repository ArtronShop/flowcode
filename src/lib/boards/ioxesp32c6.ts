import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const ioxesp32c6: BoardItem = {
    ...esp32dev,
    id: 'ioxesp32c6',
    name: 'IOXESP32-C6',
    fqbn: 'esp32:esp32:ioxesp32c6',
};

export default ioxesp32c6;
