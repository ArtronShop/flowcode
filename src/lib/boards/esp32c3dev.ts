import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const esp32c3dev: BoardItem = {
    ...esp32dev,
    id: 'esp32c3dev',
    name: 'ESP32C3 Dev Module',
    fqbn: 'esp32:esp32:esp32c3',
};

export default esp32c3dev;
