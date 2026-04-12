import { triggerCategory } from './trigger.js';
import { ioCategory } from './io.js';
import { controlCategory } from './control.js';
import { dataCategory } from './data.js';
import { variableCategory } from './variable.js';
import { serialCategory } from './serial.js';
import { functionCategory } from './function.js';
import { i2cCategory } from './i2c.js';
import { spiCategory } from './spi.js';
import { eepromCategory } from './eeprom.js';
import { storageCategory } from './storage.js';
import { wifiCategory } from './wifi.js';
import { httpCategory } from './http.js';
import { udpCategory } from './udp.js';
import { tcpCategory } from './tcp.js';
import { webserverCategory } from './webserver.js';
import { espnowCategory } from './espnow.js';

export const blockCategories = [
	triggerCategory,
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
