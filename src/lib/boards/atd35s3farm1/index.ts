import type { BoardItem } from '../types.js'
import esp32dev from "../esp32dev.js";
import { blockCategories } from './blocks/index.js';

const atd35s3farm1: BoardItem = {
    ...esp32dev,
    id: 'atd35s3farm1',
    name: 'ATD3.5-S3 + Farm1',
    fqbn: 'esp32:esp32:atd35s3:DebugLevel=info',
    depends: [ 
        'ATD3.5-S3@1.3.1', 
        'ArduinoJson@6.21.4', 
        'lvgl@8.3.11', 
        'ArtronShop_SHT45@1.0.0', 
        'ArtronShop_BH1750@1.0.0', 
        'NTPClient@3.2.1', 
        'PubSubClient@2.8', 
        'ATD3.5-S3_HandySense_Arduino_Library@1.0.0',
        'ModbusMaster@2.0.1',
    ],
    blocks: [
        ...blockCategories,
    ]
};

export default atd35s3farm1;
