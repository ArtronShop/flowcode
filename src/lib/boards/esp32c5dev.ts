import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const esp32c5dev: BoardItem = {
    ...esp32dev,
    id: 'esp32c5dev',
    name: 'ESP32C5 Dev Module',
    fqbn: 'esp32:esp32:esp32c5',
};

export default esp32c5dev;
