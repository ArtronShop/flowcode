import type { BoardItem } from '../types';
import { opt, setting } from '../helpers.js'
import esp32dev from "../esp32dev";
import { blockCategories } from './blocks';

const tinker_c6: BoardItem = {
    ...esp32dev,
    id: 'tinker_c6',
    name: 'Tinker C6',
    image: '',
    fqbn: 'esp32:esp32:esp32c6',
    settings: [
        setting('CDCOnBoot', 'USB CDC on Boot', [
            opt('Disable', 'default', true),
            opt('Enable', 'cdc'),
        ]),
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
    depends: [ 'Tinker C6@1.0.1', 'ModbusMasterPlus@2.1.1' ],
    blocks: [
        ...blockCategories,
    ]
};

export default tinker_c6;
