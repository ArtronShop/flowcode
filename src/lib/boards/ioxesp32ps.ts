import type { BoardItem } from './types.js'
import { opt, setting } from './helpers.js'
import esp32dev from "./esp32dev";

const ioxesp32ps: BoardItem = {
    ...esp32dev,
    id: 'ioxesp32ps',
    name: 'IOXESP32PS',
    fqbn: 'esp32:esp32:ioxesp32ps',
    settings: [
        setting('PSRAM', 'PSRAM', [
            opt('Disabled', 'disabled', true),
            opt('Enabled', 'enabled'),
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
};

export default ioxesp32ps;
