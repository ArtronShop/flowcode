import esp32dev from "../esp32dev";
import type { BoardItem } from '../types';
import { blockCategories } from './blocks';

const tinker_c6: BoardItem = {
    ...esp32dev,
    id: 'tinker_c6',
    name: 'Tinker C6',
    image: '',
    fqbn: 'esp32:esp32:esp32c6:CDCOnBoot=cdc',
    depends: [ 'Tinker C6@1.0.1', 'ModbusMaster@2.0.1' ],
    blocks: [
        ...blockCategories,
    ]
};

export default tinker_c6;
