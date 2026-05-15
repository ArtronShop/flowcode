import type { BoardItem } from './types.js'
import { opt, setting } from './helpers.js'
import { blockCategories } from "$lib/blocks";

const esp32dev: BoardItem = {
    id: 'esp32dev',
    name: 'ESP32 Dev Module',
    image: '',
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
        setting('FlashSize', 'Flash Size', [
            opt('4MB (32Mb)', '4M', true),
            opt('8MB (64Mb)', '8M'),
            opt('16MB (128Mb)', '16M'),
            opt('32MB (256Mb)', '32M'),
        ]),
        setting('PSRAM', 'PSRAM', [
            opt('Disabled', 'disabled', true),
            opt('Enable', 'enabled'),
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
    platform: {
        id: 'esp32:esp32',
        version: '3.3.7',
        package: 'https://espressif.github.io/arduino-esp32/package_esp32_index.json'
    },
    depends: [],
    blocks: [
        ...blockCategories
    ]
};

export default esp32dev;
