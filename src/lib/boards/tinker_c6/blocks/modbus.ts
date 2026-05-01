import type { BlockCategory } from '$lib/blocks/types.js';

const COLOR = '#f59e0b';

// ─── Serial config string ────────────────────────────────────────────────────
function serialConfig(dataBits: string, parity: string, stopBits: string): string {
    const p = parity === 'E' ? 'E' : parity === 'O' ? 'O' : 'N';
    return `SERIAL_${dataBits}${p}${stopBits}`;
}

// ─── Register common globals/functions per modbus instance ──────────────────
function registerModbusInstance(
    registerPreprocessor: (d: string) => void,
    registerGlobal: (d: string) => void,
) {
    registerPreprocessor('#include <TinkerC6.h>');
    registerPreprocessor('#include <ModbusMasterPlus.h>');
    registerGlobal(`ModbusMaster modbus;`);
}

// ─── Endian helpers ──────────────────────────────────────────────────────────
function modbusReadExpr(id: string, pad: string, rawType: string, endian: string): string {
    const wordSwap = endian.startsWith('LE'); // swap word order (register 0 ↔ 1)
    const byteSwap = endian.endsWith('-SWAP');  // swap bytes within each word
    const raw = (i: number) => `modbus.getResponseBuffer(${i})`;
    const buf = (i: number) => byteSwap
        ? `(uint16_t)((${raw(i)} >> 8) | (${raw(i)} << 8))`
        : raw(i);
    if (rawType === 'float') {
        const conv_union = [
            `union {`,
            `  uint16_t u16[2];`,
            `  float f32;`,
            `} ${id}_conv;`
        ];

        // u[0]=LSW, u[1]=MSW on little-endian MCU
        // no word swap: buf[0]=MSW→u[1], buf[1]=LSW→u[0]
        // word swap:    buf[0]=LSW→u[0], buf[1]=MSW→u[1]
        const [u0, u1] = wordSwap ? [buf(0), buf(1)] : [buf(1), buf(0)];
        return [
            ...conv_union,
            `${id}_conv.u16[0] = ${u0};`,
            `${id}_conv.u16[1] = ${u1};`,
            `float ${id} = ${id}_conv.f32;`,
        ].map(l => `${pad}  ${l}`).join('\n');
    }
    if (rawType === 'double') {
        const conv_union = [
            `union {`,
            `  uint16_t u16[4];`,
            `  double f64;`,
            `} ${id}_conv;`
        ];
        // u[0]=LSW..u[3]=MSW; no word swap: buf[0]=u[3]..buf[3]=u[0]
        const uIdx = wordSwap ? [0, 1, 2, 3] : [3, 2, 1, 0];
        return [
            ...conv_union,
            ...uIdx.map((ui, bi) => `${id}_conv.u16[${ui}] = ${buf(bi)};`),
            `double ${id} = ${id}_conv.f64;`,
        ].map(l => `${pad}  ${l}`).join('\n');
    }
    if (rawType === 'uint32' || rawType === 'int32') {
        const conv_union = [
            `union {`,
            `  uint16_t u16[2];`,
            `  uint32_t u32;`,
            `  int32_t i32;`,
            `} ${id}_conv;`
        ];
        const [u0, u1] = wordSwap ? [buf(0), buf(1)] : [buf(1), buf(0)];
        return [
            ...conv_union,
            `${id}_conv.u16[0] = ${u0};`,
            `${id}_conv.u16[1] = ${u1};`,
            `${rawType}_t ${id} = ${id}_conv.${rawType === 'uint32' ? 'u32' : 'i32'};`,
        ].map(l => `${pad}  ${l}`).join('\n');
    }
    if (rawType === 'bool') return `${pad}  bool ${id} = (modbus.getResponseBuffer(0) & 0x01) != 0;`;
    if (rawType === 'int16') return `${pad}  int16_t ${id} = (int16_t)modbus.getResponseBuffer(0);`;
    return `${pad}  uint16_t ${id} = modbus.getResponseBuffer(0);`;
}

function modbusWriteLines(id: string, pad: string, writeType: string, dataType: string, address: string, coilCount: string, valueExpr: string, endian: string): string[] {
    const wordSwap = endian.endsWith('-SWAP');
    const byteSwap = endian.startsWith('LE');
    const sw = (e: string) => byteSwap ? `(uint16_t)((${e} >> 8) | (${e} << 8))` : e;
    if (writeType === 'single_coil') return [
        `${pad}${id}_result = (uint8_t)modbus.writeSingleCoil(${address}, (${valueExpr}) ? 0xFF00 : 0x0000);`,
    ];
    if (writeType === 'multi_coils') return [
        `${pad}modbus.setTransmitBuffer(0, (uint16_t)(${valueExpr}));`,
        `${pad}${id}_result = (uint8_t)modbus.writeMultipleCoils(${address}, ${coilCount});`,
    ];
    const isMulti = writeType === 'multi_registers';
    if (dataType === 'float32') {
        // u[0]=LSW, u[1]=MSW; no word swap → send MSW first
        const [b0, b1] = wordSwap
            ? [sw(`${id}_conv.u[0]`), sw(`${id}_conv.u[1]`)]
            : [sw(`${id}_conv.u[1]`), sw(`${id}_conv.u[0]`)];
        return [
            `${pad}{ union { float f; uint16_t u[2]; } ${id}_conv; ${id}_conv.f = (float)(${valueExpr});`,
            `${pad}  modbus.setTransmitBuffer(0, ${b0});`,
            `${pad}  modbus.setTransmitBuffer(1, ${b1});`,
            `${pad}  ${id}_result = (uint8_t)modbus.writeMultipleRegisters(${address}, 2); }`,
        ];
    }
    if (dataType === 'int32') {
        const hiW = `(uint16_t)(${id}_i32 >> 16)`;
        const loW = `(uint16_t)(${id}_i32 & 0xFFFF)`;
        const [b0, b1] = wordSwap ? [sw(loW), sw(hiW)] : [sw(hiW), sw(loW)];
        return [
            `${pad}{ uint32_t ${id}_i32 = (uint32_t)(int32_t)(${valueExpr});`,
            `${pad}  modbus.setTransmitBuffer(0, ${b0});`,
            `${pad}  modbus.setTransmitBuffer(1, ${b1});`,
            `${pad}  ${id}_result = (uint8_t)modbus.writeMultipleRegisters(${address}, 2); }`,
        ];
    }
    return isMulti ? [
        `${pad}modbus.setTransmitBuffer(0, (uint16_t)(${valueExpr}));`,
        `${pad}${id}_result = (uint8_t)modbus.writeMultipleRegisters(${address}, 1);`,
    ] : [
        `${pad}${id}_result = (uint8_t)modbus.writeSingleRegister(${address}, (uint16_t)(${valueExpr}));`,
    ];
}

const modbusCategory: BlockCategory = {
    name: 'Modbus RTU',
    blocks: [

        // ─── Modbus Config ───────────────────────────────────────────────
        {
            id: 'modbus_config',
            name: 'Modbus Config',
            color: COLOR,
            icon: '🔌',
            category: 'Modbus Master',
            description: 'กำหนดค่า Modbus RTU Master: Serial Port, Pin RX/TX/DE, Baud Rate, Frame Format\nใช้ไลบรารี่ ModbusMaster',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            params: [
                {
                    id: 'baud', label: 'Baud Rate', type: 'option',
                    options: [
                        { label: '1200', value: '1200' },
                        { label: '2400', value: '2400' },
                        { label: '4800', value: '4800' },
                        { label: '9600', value: '9600' },
                        { label: '19200', value: '19200' },
                        { label: '38400', value: '38400' },
                        { label: '57600', value: '57600' },
                        { label: '115200', value: '115200' },
                    ],
                    default: '9600',
                    description: 'ความเร็ว Baud Rate',
                },
                {
                    id: 'data_bits', label: 'Data Bits', type: 'option',
                    options: [
                        { label: '8', value: '8' },
                        { label: '7', value: '7' },
                    ],
                    default: '8',
                },
                {
                    id: 'parity', label: 'Parity', type: 'option',
                    options: [
                        { label: 'None', value: 'N' },
                        { label: 'Even', value: 'E' },
                        { label: 'Odd', value: 'O' },
                    ],
                    default: 'N',
                },
                {
                    id: 'stop_bits', label: 'Stop Bits', type: 'option',
                    options: [
                        { label: '1', value: '1' },
                        { label: '2', value: '2' },
                    ],
                    default: '1',
                },
            ],
            toCode({ pad, block, safeId, params, registerPreprocessor, registerGlobal, registerFunction }) {
                const baud = params.baud ?? '9600';
                const cfg = serialConfig(params.data_bits ?? '8', params.parity ?? 'N', params.stop_bits ?? '1');

                registerModbusInstance(registerPreprocessor, registerGlobal);

                registerGlobal('unsigned long _rs485_baud = 9600;');
                registerGlobal('uint32_t _rs485_config = SERIAL_8N1;');

                return {
                    parts: [
                        [`${pad}_rs485_baud = ${baud};`],
                        [`${pad}_rs485_config = ${cfg};`],
                        [`${pad}modbus.preTransmission(TinkerC6_RS485_preTransmission);`],
                        [`${pad}modbus.postTransmission(TinkerC6_RS485_postTransmission);`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Modbus Read ─────────────────────────────────────────────────
        {
            id: 'modbus_read',
            name: 'Modbus Read',
            color: COLOR,
            icon: '📖',
            category: 'Modbus Master',
            requires: ['modbus_config'],
            description: 'อ่านค่าจาก Modbus Slave\nรองรับ Coils, Discrete Inputs, Input Registers, Holding Registers',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [],
            params: [
                {
                    id: 'slave_id', label: 'Slave ID', type: 'number',
                    default: '1', description: 'หมายเลข Modbus Slave (1-247)',
                    validation: (n: number) => Math.max(1, Math.min(247, Math.round(n))),
                },
                {
                    id: 'register_type', label: 'Register Type', type: 'option',
                    options: [
                        { label: 'Coil', value: 'coil', description: '01 (0x01) Read Coils' },
                        { label: 'Discrete Input', value: 'discrete', description: '02 (0x02) Read Discrete Inputs' },
                        { label: 'Holding Register', value: 'holding', description: '03 (0x03) Read Holding Registers' },
                        { label: 'Input Register', value: 'input', description: '04 (0x03) Read Input Registers' },
                    ],
                    default: 'holding',
                },
                {
                    id: 'address', label: 'Address', type: 'number',
                    default: '0', description: 'ที่อยู่ register (0-indexed)',
                    validation: (n: number) => Math.max(0, Math.round(n)),
                },
                {
                    id: 'data_type', label: 'Data Type', type: 'option',
                    options: [
                        { label: 'Signed', value: 'int16' },
                        { label: 'Unsigned', value: 'uint16' },
                        { label: '32 Bit Signed', value: 'int32' },
                        { label: '32 Bit Unsigned', value: 'uint32' },
                        /*{ label: '64 Bit Signed', value: 'int64' },
                        { label: '64 Bit Unsigned', value: 'uint64' },*/
                        { label: '32 Bit Float', value: 'float' },
                        { label: '64 Bit Double', value: 'double' },
                        { label: 'Binary', value: 'bool' },
                    ],
                    default: 'int16',
                    hidden: ({ params }) => params.register_type === 'coil' || params.register_type === 'discrete',
                },
                {
                    id: 'endian', type: 'option', label: 'Endian',
                    options: [
                        { label: 'Big-endian', value: 'BE' },
                        { label: 'Big-endian byte swap', value: 'BE-SWAP' },
                        { label: 'Little-endian', value: 'LE' },
                        { label: 'Little-endian byte swap', value: 'LE-SWAP' },
                    ],
                    description: 'ลำดับไบต์ Big-endian / Little-endian / Swap',
                    hidden: ({ params }) => params.register_type === 'coil' || params.register_type === 'discrete' || ['int32', 'uint32', 'float', 'double'].indexOf(params.data_type) < 0
                },
                {
                    id: 'power', type: 'option', label: '12V Power',
                    options: [
                        { label: 'Enable (ON)', value: '1' },
                        { label: 'Disable (OFF)', value: '0' },
                    ],
                    default: '1',
                    description: 'เปิดไฟเลี้ยง 12V ก่อนเริ่มอ่านข้อมูล',
                },
                {
                    id: 'idle_time', type: 'number', label: 'Wait before read time (mS)', default: '3000', description: 'ระยะเวลารออุปกรณ์ทำงานเสถียรก่อนอ่านข้อมูล',
                    hidden: ({ params }) => params.power === '0'
                },
                { id: 'try_times', type: 'number', label: 'Try times', default: '5', description: 'จำนวนครั้งที่อ่านซ้ำกรณีอ่านค่าไม่ได้' },
            ],
            dynamicPorts(params) {
                const dataType = ({
                    'int16': 'int',
                    'uint16': 'int',
                    'int32': 'long',
                    'uint32': 'long',
                    'int64': 'int',
                    'uint64': 'int',
                    'float': 'float',
                    'double': 'double',
                    'bool': 'bool',
                })[params.data_type] ?? 'int';
                return {
                    outputs: [
                        { id: 'value', type: 'output', label: 'Value', dataType, description: 'ค่าที่อ่านได้' },
                        { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'รันเมื่ออ่านไม่สำเร็จ' },
                        { id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ต่อเสมอหลัง if/else' },
                    ]
                }
            },
            toCode({ pad, block, safeId, params, registerPreprocessor, registerGlobal, registerFunction }) {
                const slaveId = params.slave_id ?? '1';
                const regType = params.register_type ?? 'holding';
                const address = params.address ?? '0';
                const rawType = (regType === 'coil' || regType === 'discrete') ? 'bool' : (params.data_type ?? 'int16');
                const power = params.power ?? '1';
                const idle_time = params.idle_time ?? '3000';
                const try_times = params.try_times ?? '5';
                const endian = params.endian ?? 'BE';
                const id = safeId(block.id);

                registerModbusInstance(registerPreprocessor, registerGlobal);
                const isFloat = rawType === 'float';
                const isDouble = rawType === 'double';
                const isInt32 = rawType === 'int32';
                const isUint32 = rawType === 'uint32';
                const qty = isDouble ? 4 : (isFloat || isInt32 || isUint32) ? 2 : 1;

                let readCall: string;
                if (regType === 'holding') readCall = `modbus.readHoldingRegisters(${address}, ${qty})`;
                else if (regType === 'input') readCall = `modbus.readInputRegisters(${address}, ${qty})`;
                else if (regType === 'coil') readCall = `modbus.readCoils(${address}, 1)`;
                else readCall = `modbus.readDiscreteInputs(${address}, 1)`;

                const valueExpr = modbusReadExpr(id, pad, rawType, endian);

                return {
                    parts: [
                        [`${pad}${power === '0' ? '// ' : ''}TinkerC6.Power.enable12V();`],
                        [`${pad}${power === '0' ? '// ' : ''}TinkerC6.Power.enterToLightSleep(${idle_time});`],
                        [`${pad}TinkerC6.RS485.begin(_rs485_baud, _rs485_config);`],
                        [`${pad}modbus.begin(${slaveId}, TinkerC6.RS485);`],
                        [`${pad}TinkerC6.RS485.enable();`],
                        [`${pad}uint8_t ${id}_result;`],
                        [`${pad}{ // Try read block`],
                        [`${pad}  int err_count = 0;`],
                        [`${pad}  while ((${id}_result = ${readCall}) != ModbusMaster::ku8MBSuccess) {`],
                        [`${pad}    TinkerC6.Power.enterToLightSleep(1000);`],
                        [`${pad}    err_count++;`],
                        [`${pad}    if (err_count > ${try_times}) { // try only ${try_times} times`],
                        [`${pad}      break;`],
                        [`${pad}    }`],
                        [`${pad}  }`],
                        [`${pad}}`],
                        [`${pad}TinkerC6.RS485.end();`],
                        [`${pad}TinkerC6.RS485.disable();`],
                        [`${pad}${power === '0' ? '// ' : ''}TinkerC6.Power.disable12V();`],
                        [`${pad}if (${id}_result == ModbusMaster::ku8MBSuccess) {`],
                        [valueExpr],
                        { portId: 'value', depthDelta: 1 },
                        [`${pad}} else {`],
                        { portId: 'error', depthDelta: 1 },
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Modbus Write ────────────────────────────────────────────────
        {
            id: 'modbus_write',
            name: 'Modbus Write',
            color: COLOR,
            icon: '✏️',
            category: 'Modbus Master',
            requires: ['modbus_config'],
            description: 'เขียนค่าไปยัง Modbus Slave\nรองรับ Single Coil, Single/Multiple Holding Registers',
            inputs: [
                { id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'จุดต่อสายบล็อกก่อนหน้า' },
                { id: 'value', type: 'input', label: 'Value', dataType: 'any', description: 'ค่าที่ต้องการเขียน (ถ้าไม่ต่อสาย ใช้ค่าจาก param)' },
            ],
            outputs: [
                { id: 'success', type: 'output', label: 'Success', dataType: 'void', description: 'รันเมื่อเขียนสำเร็จ' },
                { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'รันเมื่อเขียนไม่สำเร็จ' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ต่อเสมอหลัง if/else' },
            ],
            params: [
                {
                    id: 'slave_id', label: 'Slave ID', type: 'number',
                    default: '1', description: 'หมายเลข Modbus Slave (1-247)',
                    validation: (n: number) => Math.max(1, Math.min(247, Math.round(n))),
                },
                {
                    id: 'write_type', label: 'Write Type', type: 'option',
                    options: [
                        { label: 'Single Coil', value: 'single_coil', description: 'writeSingleCoil (FC 05)' },
                        { label: 'Single Register', value: 'single_register', description: 'writeSingleRegister (FC 06)' },
                        { label: 'Multiple Coils', value: 'multi_coils', description: 'writeMultipleCoils (FC 15)' },
                        { label: 'Multiple Registers', value: 'multi_registers', description: 'writeMultipleRegisters (FC 16)' },
                    ],
                    default: 'single_register',
                },
                {
                    id: 'address', label: 'Address', type: 'number',
                    default: '0', description: 'ที่อยู่ register (0-indexed)',
                    validation: (n: number) => Math.max(0, Math.round(n)),
                },
                {
                    id: 'data_type', label: 'Data Type', type: 'option',
                    options: [
                        { label: 'int16  (signed 16-bit)', value: 'int16' },
                        { label: 'uint16 (word)', value: 'uint16' },
                        { label: 'int32  (signed 32-bit)', value: 'int32' },
                        { label: 'float32', value: 'float32' },
                    ],
                    default: 'int16',
                    hidden: ({ params }) => params.write_type === 'single_coil' || params.write_type === 'multi_coils',
                },
                {
                    id: 'coil_count', label: 'Coil Count', type: 'number',
                    default: '8', description: 'จำนวน Coil ที่ต้องการเขียน (ใช้กับ Multiple Coils)',
                    validation: (n: number) => Math.max(1, Math.round(n)),
                    hidden: ({ params }) => params.write_type !== 'multi_coils',
                },
                {
                    id: 'value', label: 'Value', type: 'text',
                    default: '0', description: 'ค่าที่เขียน (ใช้เมื่อไม่มีสายต่อเข้า Value port)',
                },
                {
                    id: 'power', type: 'option', label: '12V Power',
                    options: [
                        { label: 'Enable (ON)', value: '1' },
                        { label: 'Disable (OFF)', value: '0' },
                    ],
                    default: '1',
                    description: 'เปิดไฟเลี้ยง 12V ก่อนเริ่มเขียนข้อมูล',
                },
                {
                    id: 'idle_time', type: 'number', label: 'Wait before write time (mS)', default: '3000', description: 'ระยะเวลารออุปกรณ์ทำงานเสถียรก่อนเขียนข้อมูล',
                    hidden: ({ params }) => params.power === '0'
                },
                { id: 'try_times', type: 'number', label: 'Try times', default: '5', description: 'จำนวนครั้งที่เขียนซ้ำกรณีเขียนค่าไม่สำเร็จ' },
                {
                    id: 'endian', type: 'option', label: 'Endian',
                    options: [
                        { label: 'Big-endian', value: 'BE' },
                        { label: 'Big-endian byte swap', value: 'BE-SWAP' },
                        { label: 'Little-endian', value: 'LE' },
                        { label: 'Little-endian byte swap', value: 'LE-SWAP' },
                    ],
                    default: 'BE',
                    description: 'ลำดับไบต์ Big-endian / Little-endian / Swap',
                    hidden: ({ params }) => params.write_type === 'single_coil' || params.write_type === 'multi_coils' || (params.data_type !== 'int32' && params.data_type !== 'float32'),
                },
            ],
            toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor, registerGlobal, registerFunction }) {
                const slaveId = params.slave_id ?? '1';
                const writeType = params.write_type ?? 'single_register';
                const address = params.address ?? '0';
                const dataType = params.data_type ?? 'int16';
                const coilCount = params.coil_count ?? '8';
                const fallback = params.value ?? '0';
                const power = params.power ?? '1';
                const idle_time = params.idle_time ?? '3000';
                const try_times = params.try_times ?? '5';
                const endian = params.endian ?? 'BE';
                const id = safeId(block.id);

                const valueExpr = resolveInput('value') ?? fallback;

                registerModbusInstance(registerPreprocessor, registerGlobal);
                const writePad = pad + '    ';
                const writeLines = modbusWriteLines(id, writePad, writeType, dataType, address, coilCount, valueExpr, endian);

                return {
                    parts: [
                        [`${pad}${power === '0' ? '// ' : ''}TinkerC6.Power.enable12V();`],
                        [`${pad}${power === '0' ? '// ' : ''}TinkerC6.Power.enterToLightSleep(${idle_time});`],
                        [`${pad}TinkerC6.RS485.begin(_rs485_baud, _rs485_config);`],
                        [`${pad}modbus.begin(${slaveId}, TinkerC6.RS485);`],
                        [`${pad}TinkerC6.RS485.enable();`],
                        [`${pad}uint8_t ${id}_result = 0;`],
                        [`${pad}{ // Try write block`],
                        [`${pad}  int err_count = 0;`],
                        [`${pad}  while (1) {`],
                        writeLines,
                        [`${pad}    if (${id}_result == ModbusMaster::ku8MBSuccess) {`],
                        [`${pad}      break;`],
                        [`${pad}    } else {`],
                        [`${pad}      TinkerC6.Power.enterToLightSleep(1000);`],
                        [`${pad}      err_count++;`],
                        [`${pad}      if (err_count > ${try_times}) { // try only ${try_times} times`],
                        [`${pad}        break;`],
                        [`${pad}      }`],
                        [`${pad}    }`],
                        [`${pad}  }`],
                        [`${pad}}`],
                        [`${pad}TinkerC6.RS485.end();`],
                        [`${pad}TinkerC6.RS485.disable();`],
                        [`${pad}${power === '0' ? '// ' : ''}TinkerC6.Power.disable12V();`],
                        [`${pad}if (${id}_result == ModbusMaster::ku8MBSuccess) {`],
                        { portId: 'success', depthDelta: 1 },
                        [`${pad}} else {`],
                        { portId: 'error', depthDelta: 1 },
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },
    ]
};

export { modbusCategory };
