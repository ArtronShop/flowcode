import type { BoardItem } from './types.js'
import esp32s3dev from "./esp32s3dev.js";

const esphub75: BoardItem = {
    ...esp32s3dev,
    id: 'esphub75',
    name: 'ESP-HUB75',
    fqbn: 'esp32:esp32:esp32s3:CDCOnBoot=cdc',

};

export default esphub75;
