import type { BoardItem } from './types.js'
import esp32dev from "./esp32dev";

const ioxesp32ps: BoardItem = {
    ...esp32dev,
    id: 'ioxesp32ps',
    name: 'IOXESP32PS',
    fqbn: 'esp32:esp32:ioxesp32ps',
};

export default ioxesp32ps;
