import type { BoardItem } from './types.js'
import { opt, setting } from './helpers.js'
import esp32dev from "./esp32dev";

const esp32c3dev: BoardItem = {
    ...esp32dev,
    id: 'esp32c3dev',
    name: 'ESP32C3 Dev Module',
    fqbn: 'esp32:esp32:esp32c3',
    settings: [
        setting('CDCOnBoot', 'USB CDC on Boot', [
            opt('Disable', 'default', true),
            opt('Enable', 'cdc'),
        ]),
        setting('FlashMode', 'Flash Mode', [
            opt('QIO', 'qio', true),
            opt('DIO', 'dio'),
        ]),
        setting('FlashSize', 'Flash Size', [
            opt('4MB (32Mb)', '4M', true),
            opt('8MB (64Mb)', '8M'),
            opt('2MB (16Mb)', '2M'),
            opt('16MB (128Mb)', '16M'),
        ]),
        setting('DebugLevel', 'Core Debug Level', [
            opt('None', 'none', true),
            opt('Error', 'error'),
            opt('Warn', 'warn'),
            opt('Info', 'info'),
            opt('Debug', 'debug'),
            opt('Verbose', 'verbose'),
        ]),
    ]
};

export default esp32c3dev;
