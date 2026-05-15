import type { BoardItem } from '../types.js'
import { opt, setting } from '../helpers.js'
import esp32dev from "../esp32dev.js";
import { blockCategories } from './blocks';

const esphub75: BoardItem = {
    ...esp32dev,
    id: 'esphub75',
    name: 'ESP-HUB75',
    fqbn: 'esp32:esp32:esp32s3:CDCOnBoot=cdc',
    settings: [
        setting('PSRAM', 'PSRAM', [
            opt('Disabled', 'disabled', true),
            opt('QSPI PSRAM', 'enabled'),
            opt('OPI PSRAM', 'opi'),
        ]),
        setting('DebugLevel', 'Core Debug Level', [
            opt('None', 'none', true),
            opt('Error', 'error'),
            opt('Warn', 'warn'),
            opt('Info', 'info'),
            opt('Debug', 'debug'),
            opt('Verbose', 'verbose'),
        ]),
    ],
    depends: [ 'Adafruit Protomatter@1.7.1', 'Adafruit GFX Library@1.12.6' ],
    blocks: [
        ...blockCategories,
    ]
};

export default esphub75;
