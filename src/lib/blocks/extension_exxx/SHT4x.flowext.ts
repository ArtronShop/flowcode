import type { BlockCategory, CodeGenContext } from '../types.js';

function SHT4xRegistor(
    registerPreprocessor: CodeGenContext['registerPreprocessor'], 
    registerGlobal: CodeGenContext['registerGlobal'], 
    registerFunction: CodeGenContext['registerFunction']
) {
    registerPreprocessor('#include <Wire.h>');
    registerPreprocessor('#include <ArtronShop_SHT45.h>');
    
    registerGlobal('ArtronShop_SHT45 sht4x(&Wire, 0x44); // SHT45-AD1B => 0x44');

    registerFunction(
        'bool sht4x_read(float * t, float * h)',
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

const sht4xExtension: BlockCategory = {
    id: 'sht4x-read',
    name: 'SHT4x',
    blocks: [
        {
            id: 'sht4x-read-temp',
            name: 'SHT4x Read',
            color: '#3b82f6',
			icon: '🌡️',
			category: 'SHT4x',
			description: 'อ่านค่าอุณหภูมิและความชื้นจากเซ็นเซอร์ SHT4x',
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
                        [`${pad}if (sht4x_read(${value_type === 't' ? `&${id}, NULL` : `NULL, &${id}`})) {`],
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

export default sht4xExtension;
