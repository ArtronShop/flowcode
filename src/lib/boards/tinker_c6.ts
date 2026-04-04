import { blockCategories } from "$lib/blocks";
import esp32dev from "./esp32dev";
import type { BoardItem } from './types.js'

const tinker_c6: BoardItem = {
    ...esp32dev,
    id: 'tinker_c6',
    name: 'Tinker C6',
    image: '',
    fqbn: 'esp32:esp32:esp32c6',
    depends: [],
    blocks: [
        ...blockCategories,
        // TODO: add block for Tinker C6 board
    ]
};

export default tinker_c6;
