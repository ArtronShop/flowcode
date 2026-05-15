import type { BoardItem } from '../types.js'
import { opt, setting } from '../helpers.js'
import esp32dev from "../esp32dev";
import { blockCategories } from './blocks';

const espobd2: BoardItem = {
    ...esp32dev,
    id: 'espobd2',
    name: 'ESP-OBD2',
    fqbn: 'esp32:esp32:esp32',
    settings: [
        setting('FlashMode', 'Flash Mode', [
            opt('QIO', 'qio', true),
            opt('DIO', 'dio'),
        ]),
        setting('FlashFreq', 'Flash Frequency', [
            opt('80MHz', '80', true),
            opt('40MHz', '40'),
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
    blocks: [
        ...blockCategories,
    ]
};

export default espobd2;
