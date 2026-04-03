import type { BlockCategory, CodeGenContext } from '../types.js';

function SHT4xRegistor(
    registerPreprocessor: CodeGenContext['registerPreprocessor'], 
    registerGlobal: CodeGenContext['registerGlobal'], 
    registerFunction: CodeGenContext['registerFunction']
) {
    registerPreprocessor('#include <Wire.h>');
    registerPreprocessor('#include <ArtronShop_SHT3x.h>');
    
    registerGlobal('ArtronShop_SHT3x sht3x(0x44, &Wire); // ADDR: 0 => 0x44, ADDR: 1 => 0x45');

    registerFunction(
        'bool sht3x_read(float * t, float * h)',
        '  static bool init = false;\n' +
        '  if (!init) {\n' + 
        '    if (!sht4x.begin()) {\n' +
        '      return false;\n' +
        '    }\n' +
        '    init = true;\n' +
        '  }\n' +
        '\n' +
        '  if (!sht4x.measure()) {\n' +
        '    init = false;\n' +
        '    return false;\n' +
        '  }\n' +
        '  if (t) {\n' +
        '    *t = sht4x.temperature();\n' +
        '  }\n' +
        '  if (h) {\n' + 
        '    *h = sht4x.humidity();\n' +
        '  }',
        'bool sht4x_read(float * t, float * h) ;'
    );
}

const sht3xExtension: BlockCategory = {
    id: 'sht3x-read',
    name: 'SHT3x',
    blocks: [
        {
            id: 'sht3x-read-temp',
            name: 'SHT3x Read',
            color: '#3b82f6',
			icon: '🌡️',
			category: 'SHT3x',
			description: 'อ่านค่าอุณหภูมิและความชื้นจากเซ็นเซอร์ SHT3x',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'จุดต่อสายบล็อกก่อนหน้า' }],
			outputs: [
                { id: 'value', type: 'output', label: 'Value', dataType: 'float', description: 'ค่าที่ได้จากเซ็นเซอร์' },
                { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'บล็อกที่ต้องการให้ทำงานเมื่ออ่านค่าไม่ได้' }
            ],
            params: [
                { id: 'value_type', label: 'Value', description: 'ค่าที่ต้องการอ่าน (อุณหภูมิ / ความชื้น)', type: 'option', options: [
                    { label: 'Temperature (°C)', value: 't' },
                    { label: 'Humidity (%RH)', value: 'h' },
                ]}
            ],
			toCode({ pad, block, registerPreprocessor, registerGlobal, registerFunction, safeId, params }) {
                SHT4xRegistor(registerPreprocessor, registerGlobal, registerFunction);
                
                const value_type = params.value_type ?? 't';
                const id = safeId(block.id);
                return { 
                    parts: [
                        [`${pad}float ${id} = 0;`],
                        [`${pad}if (sht3x_read(${value_type === 't' ? `&${id}, NULL` : `NULL, &${id}`})) {`],
						{ portId: 'value', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`]
                    ]
                };
            }
        },
    ]
}

export default sht3xExtension;
