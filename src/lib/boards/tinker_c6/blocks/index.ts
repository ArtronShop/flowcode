// Block build-in
import { triggerCategory } from '$lib/blocks/trigger';
import { ioCategory } from '$lib/blocks/io';
import { controlCategory } from '$lib/blocks/control';
import { dataCategory } from '$lib/blocks/data';
import { variableCategory } from '$lib/blocks/variable';
import { serialCategory } from '$lib/blocks/serial';
import { functionCategory } from '$lib/blocks/function';
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
import { powerCategory } from './power';
import { modbusCategory } from './modbus';
import { analogCategory } from './analog';
import { i2cCategory } from './i2c';

// Use extention blocks
import mqttExtension from '$lib/blocks/extension/MQTT.flowext';
import blynkExtension from '$lib/blocks/extension/Blynk.flowext';


export const blockCategories = [
    // Basic Block
    triggerCategory,
    serialCategory,
    controlCategory,
    dataCategory,
    variableCategory,
    functionCategory,

    // Sensor Block
    powerCategory,
    ioCategory,
    modbusCategory,
    analogCategory,
    i2cCategory,

    // IoT Block
    wifiCategory,
    mqttExtension,
    httpCategory,
    blynkExtension,
    udpCategory,
    tcpCategory,
    espnowCategory,

    // Low Level Block
    spiCategory,
    eepromCategory,
    storageCategory,
    webserverCategory,
];
