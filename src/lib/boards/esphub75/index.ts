import type { BoardItem } from '../types.js'
import esp32s3dev from "../esp32s3dev.js";
import { blockCategories } from './blocks';

const esphub75: BoardItem = {
    ...esp32s3dev,
    id: 'esphub75',
    name: 'ESP-HUB75',
    fqbn: 'esp32:esp32:esp32s3:CDCOnBoot=cdc',
    depends: [ 'Adafruit Protomatter@1.7.1', 'Adafruit GFX Library@1.12.6' ],
    blocks: [
        ...blockCategories,
    ]
};

export default esphub75;
