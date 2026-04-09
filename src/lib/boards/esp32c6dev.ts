import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const esp32c6dev: BoardItem = {
    ...esp32dev,
    id: 'esp32c6dev',
    name: 'ESP32C6 Dev Module',
    fqbn: 'esp32:esp32:esp32c6',
};

export default esp32c6dev;
