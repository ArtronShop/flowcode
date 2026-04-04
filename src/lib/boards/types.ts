import type { BlockCategory } from '$lib/blocks/types.js';

export type BoardItem = {
    id: string;
    name: string;
    image: string;
    fqbn: string;
    platform: {
        id: string;
        version: string;
        package: string; // Package index URL (.json)
    };
    depends?: string[];
    blocks: BlockCategory[];
};
