import type { BoardItem } from './types.js'
import { blockCategories } from "$lib/blocks";

const esp32dev: BoardItem = {
    id: 'esp32dev',
    name: 'ESP32 Dev Module',
    image: '',
    fqbn: 'esp32:esp32:esp32',
    platform: {
        id: 'esp32:esp32',
        version: '3.3.7',
        package: 'https://espressif.github.io/arduino-esp32/package_esp32_index.json'
    },
    depends: [],
    blocks: [
        ...blockCategories
    ]
};

export default esp32dev;
