// Block build-in
import { triggerCategory } from '$lib/blocks/trigger';
import { ioCategory } from '$lib/blocks/io';
import { controlCategory } from '$lib/blocks/control';
import { dataCategory } from '$lib/blocks/data';
import { variableCategory } from '$lib/blocks/variable';
import { serialCategory } from '$lib/blocks/serial';
import { functionCategory } from '$lib/blocks/function';
import { i2cCategory } from '$lib/blocks/i2c';
import { spiCategory } from '$lib/blocks/spi';
import { eepromCategory } from '$lib/blocks/eeprom';
import { storageCategory } from '$lib/blocks/storage';
import { wifiCategory } from '$lib/blocks/wifi';
import { httpCategory } from '$lib/blocks/http';
import { udpCategory } from '$lib/blocks/udp';
import { tcpCategory } from '$lib/blocks/tcp';
import { webserverCategory } from '$lib/blocks/webserver';
import { espnowCategory } from '$lib/blocks/espnow';

// Board blocks
import { canCategory } from './can';

export const blockCategories = [
    triggerCategory,
    canCategory,
    ioCategory,
    controlCategory,
    dataCategory,
    variableCategory,
    serialCategory,
    functionCategory,
    i2cCategory,
    spiCategory,
    eepromCategory,
    storageCategory,
    wifiCategory,
    httpCategory,
    udpCategory,
    tcpCategory,
    webserverCategory,
    espnowCategory,
];
