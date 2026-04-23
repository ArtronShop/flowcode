import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const ioxesp32: BoardItem = {
    ...esp32dev,
    id: 'ioxesp32',
    name: 'IOXESP32',
    fqbn: 'esp32:esp32:ioxesp32',
};

export default ioxesp32;
