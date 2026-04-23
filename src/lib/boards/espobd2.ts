import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const espobd2: BoardItem = {
    ...esp32dev,
    id: 'espobd2',
    name: 'ESP-OBD2',
    fqbn: 'esp32:esp32:esp32',
};

export default espobd2;
