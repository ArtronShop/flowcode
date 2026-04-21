export type SnackbarItem = {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error';
    action?: { label: string; href?: string; onclick?: () => void };
    autoClose?: number; // ms — undefined = no auto-close
    hideClose?: boolean; // ซ่อนปุ่มปิด — ใช้สำหรับ snackbar ที่ต้องค้างจนกว่าเงื่อนไขจะเปลี่ยน
};

class SnackbarStore {
    items = $state<SnackbarItem[]>([]);
    private nextId = 0;

    show(opts: Omit<SnackbarItem, 'id'>): number {
        const id = ++this.nextId;
        this.items = [...this.items, { ...opts, id }];
        if (opts.autoClose) {
            setTimeout(() => this.close(id), opts.autoClose);
        }
        return id;
    }

    close(id: number) {
        this.items = this.items.filter(i => i.id !== id);
    }
}

export const snackbar = new SnackbarStore();
