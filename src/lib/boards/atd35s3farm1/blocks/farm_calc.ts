import type { BlockCategory } from '../../../blocks/types.js';

const COLOR = '#65a30d'; // lime-600

export const farmCalcCategory: BlockCategory = {
    name: 'Farm Calculation',
    blocks: [

        // ─── VPD ────────────────────────────────────────────────────────
        {
            id: 'calc_vpd',
            name: 'VPD',
            color: COLOR,
            icon: '💨',
            category: 'farm_calc',
            description: 'คำนวณ Vapour Pressure Deficit (kPa)\nVPD ต่ำ (<0.4): เสี่ยงเชื้อรา | เหมาะ (0.8-1.2) | สูง (>1.6): พืชเหี่ยว\nVPD = SVP × (1 - RH/100)',
            inputs: [
                { id: 'temp',     type: 'input', label: 'Temp (°C)', dataType: 'float' },
                { id: 'humidity', type: 'input', label: 'Humidity (%)', dataType: 'float' },
            ],
            outputs: [{ id: 'result', type: 'output', label: 'VPD (kPa)', dataType: 'float' }],
            toCode({ block, pad, safeId, resolveInput, registerPreprocessor }) {
                registerPreprocessor('#include <math.h>');
                const id   = safeId(block.id);
                const temp = resolveInput('temp')     ?? '25.0f';
                const rh   = resolveInput('humidity') ?? '60.0f';
                return {
                    parts: [
                        [
                            `${pad}float ${id};`,
                            `${pad}{`,
                            `${pad}  float _svp = 0.6108f * expf(17.27f * (${temp}) / ((${temp}) + 237.3f));`,
                            `${pad}  ${id} = _svp * (1.0f - (${rh}) / 100.0f);`,
                            `${pad}}`,
                        ],
                        { portId: 'result', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Dew Point ───────────────────────────────────────────────────
        {
            id: 'calc_dew_point',
            name: 'Dew Point',
            color: COLOR,
            icon: '💧',
            category: 'farm_calc',
            description: 'คำนวณจุดน้ำค้าง (°C) ด้วย Magnus formula\nเมื่อ Dew Point ≈ อุณหภูมิอากาศ = น้ำค้างเกาะ เสี่ยงเชื้อรา',
            inputs: [
                { id: 'temp',     type: 'input', label: 'Temp (°C)', dataType: 'float' },
                { id: 'humidity', type: 'input', label: 'Humidity (%)', dataType: 'float' },
            ],
            outputs: [{ id: 'result', type: 'output', label: 'Dew Point (°C)', dataType: 'float' }],
            toCode({ block, pad, safeId, resolveInput, registerPreprocessor }) {
                registerPreprocessor('#include <math.h>');
                const id   = safeId(block.id);
                const temp = resolveInput('temp')     ?? '25.0f';
                const rh   = resolveInput('humidity') ?? '60.0f';
                return {
                    parts: [
                        [
                            `${pad}float ${id};`,
                            `${pad}{`,
                            `${pad}  const float _a = 17.625f, _b = 243.04f;`,
                            `${pad}  float _g = logf((${rh}) / 100.0f) + _a * (${temp}) / (_b + (${temp}));`,
                            `${pad}  ${id} = _b * _g / (_a - _g);`,
                            `${pad}}`,
                        ],
                        { portId: 'result', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Heat Index ──────────────────────────────────────────────────
        {
            id: 'calc_heat_index',
            name: 'Heat Index',
            color: COLOR,
            icon: '🌡️',
            category: 'farm_calc',
            description: 'คำนวณดัชนีความร้อน (°C) จาก Steadman formula\nแสดงความรู้สึกจริงของความร้อนที่พืช/สัตว์ได้รับ\nใช้ได้เมื่อ Temp > 27°C และ Humidity > 40%',
            inputs: [
                { id: 'temp',     type: 'input', label: 'Temp (°C)', dataType: 'float' },
                { id: 'humidity', type: 'input', label: 'Humidity (%)', dataType: 'float' },
            ],
            outputs: [{ id: 'result', type: 'output', label: 'Heat Index (°C)', dataType: 'float' }],
            toCode({ block, pad, safeId, resolveInput }) {
                const id   = safeId(block.id);
                const temp = resolveInput('temp')     ?? '30.0f';
                const rh   = resolveInput('humidity') ?? '60.0f';
                return {
                    parts: [
                        [
                            `${pad}float ${id};`,
                            `${pad}{`,
                            `${pad}  float _t = (${temp}), _h = (${rh});`,
                            `${pad}  ${id} = -8.78469f`,
                            `${pad}    + 1.61139f  * _t`,
                            `${pad}    + 2.33855f  * _h`,
                            `${pad}    - 0.14612f  * _t * _h`,
                            `${pad}    - 0.01231f  * _t * _t`,
                            `${pad}    - 0.01642f  * _h * _h`,
                            `${pad}    + 0.00221f  * _t * _t * _h`,
                            `${pad}    + 0.00073f  * _t * _h * _h`,
                            `${pad}    - 0.0000036f * _t * _t * _h * _h;`,
                            `${pad}}`,
                        ],
                        { portId: 'result', depthDelta: 0 },
                    ]
                };
            }
        },
    ]
};
