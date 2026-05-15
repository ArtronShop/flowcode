import type { BoardItem } from './types.js'
import { opt, setting } from './helpers.js'
import esp32dev from "./esp32dev";

const ioxesp32: BoardItem = {
    ...esp32dev,
    id: 'ioxesp32',
    name: 'IOXESP32',
    fqbn: 'esp32:esp32:ioxesp32',
    settings: [
        setting('DebugLevel', 'Core Debug Level', [
            opt('None', 'none', true),
            opt('Error', 'error'),
            opt('Warn', 'warn'),
            opt('Info', 'info'),
            opt('Debug', 'debug'),
            opt('Verbose', 'verbose'),
        ]),
    ],
};

export default ioxesp32;
