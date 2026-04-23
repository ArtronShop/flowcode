import type { BoardItem } from './types'

// Bare board / Dev Kit
import esp32dev from './esp32dev';
import esp32s3dev from './esp32s3dev';
import esp32c3dev from './esp32c3dev';
import esp32c6dev from './esp32c6dev';
import esp32c5dev from './esp32c5dev';
import ioxesp32 from './ioxesp32';
import ioxesp32ps from './ioxesp32ps';
import ioxesp32c6 from './ioxesp32c6';

// High Level board
import espobd2 from './espobd2';
import tinker_c6 from './tinker_c6';
import esphub75 from './esphub75';

const boards: BoardItem[] = [
    esp32dev,
    esp32s3dev,
    esp32c3dev,
    esp32c5dev,
    esp32c6dev,
    ioxesp32,
    ioxesp32ps,
    ioxesp32c6,
    espobd2,
    tinker_c6,
    esphub75,
];

export default boards;
