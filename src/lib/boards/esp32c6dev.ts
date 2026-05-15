import type { BoardItem } from './types.js'
import { opt, setting } from './helpers.js'
import esp32dev from "./esp32dev";

const esp32c6dev: BoardItem = {
    ...esp32dev,
    id: 'esp32c6dev',
    name: 'ESP32C6 Dev Module',
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
        setting('FlashSize', 'Flash Size', [
            opt('4MB (32Mb)', '4M', true),
            opt('8MB (64Mb)', '8M'),
            opt('2MB (16Mb)', '2M'),
            opt('16MB (128Mb)', '16M'),
        ]),
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
    ]
};

export default esp32c6dev;
