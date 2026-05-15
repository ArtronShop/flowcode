import type { BoardItem } from './types.js'
import { opt, setting } from './helpers.js'
import esp32dev from "./esp32dev";

const esp32s3dev: BoardItem = {
    ...esp32dev,
    id: 'esp32s3dev',
    name: 'ESP32S3 Dev Module',
    fqbn: 'esp32:esp32:esp32s3',
    settings: [
        setting('CDCOnBoot', 'USB CDC on Boot', [
            opt('Disable', 'default', true),
            opt('Enable', 'cdc'),
        ]),
        setting('FlashMode', 'Flash Mode', [
            opt('QIO 80MHz', 'qio', true),
            opt('QIO 120MHz', 'qio120'),
            opt('DIO 80MHz', 'dio'),
            opt('OPI 80MHz', 'opi'),
        ]),
        setting('FlashSize', 'Flash Size', [
            opt('4MB (32Mb)', '4M', true),
            opt('8MB (64Mb)', '8M'),
            opt('16MB (128Mb)', '16M'),
            opt('32MB (256Mb)', '32M'),
        ]),
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
};

export default esp32s3dev;
