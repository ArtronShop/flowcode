import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const esp32s3dev: BoardItem = {
    ...esp32dev,
    id: 'esp32s3dev',
    name: 'ESP32S3 Dev Module',
    fqbn: 'esp32:esp32:esp32s3',
};

export default esp32s3dev;
