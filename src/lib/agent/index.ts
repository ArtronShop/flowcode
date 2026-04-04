import type { BoardOption, PortDataPayload, PortProps, StreamPayload, WsMessage } from "./types";

export class FlowcodeAgent {
    private ws: WebSocket | null = null;
    private callbacks: Map<string, { resolve: (val: any) => void; reject: (err: Error) => void }> = new Map();
    
    // Callbacks สำหรับเหตุการณ์ต่างๆ
    public onStream?: (payload: StreamPayload) => void;
    public onPortData?: (payload: PortDataPayload) => void;

    constructor(private url: string = "ws://localhost:8080") {}

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => resolve();

            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    const response: WsMessage = JSON.parse(event.data);
                    const { id, type, payload } = response;

                    switch (type) {
                        case "stream":
                            this.onStream?.(payload);
                            break;
                        case "port.data":
                            this.onPortData?.(payload);
                            break;
                        case "error":
                            if (id && this.callbacks.has(id)) {
                                this.callbacks.get(id)?.reject(new Error(payload));
                                this.callbacks.delete(id);
                            }
                            break;
                        case "result":
                            if (id && this.callbacks.has(id)) {
                                this.callbacks.get(id)?.resolve(payload);
                                this.callbacks.delete(id);
                            }
                            break;
                    }
                } catch (e) {
                    console.error("Parse error:", e);
                }
            };

            this.ws.onerror = (err) => reject(err);
            this.ws.onclose = () => console.log("Agent Disconnected");
        });
    }

    private _send<T>(action: string, params: object = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return reject(new Error("WebSocket not connected"));
            }
            const id = Math.random().toString(36).substring(2, 11);
            this.callbacks.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, action, params }));
        });
    }

    // ─── Board & Core ──────────────────────────────────────────────

    public listBoards() { return this._send<any[]>("board.list"); }
    
    public listAllBoards(fqbn: string = "") { 
        return this._send<any[]>("board.listall", { fqbn }); 
    }

    public installCore(id: string, version: string, package_index?: string) {
        return this._send<{ ok: boolean }>("core.install", { id, version, package_index });
    }

    public installLibrary(depends: string[]) {
        return this._send<{ ok: boolean }>("lib.install", { depends });
    }

    // ─── Sketch ────────────────────────────────────────────────────

    public listSketches() { return this._send<string[]>("sketch.list"); }

    public createSketch(name: string, code: string = "") {
        return this._send<{ path: string }>("sketch.create", { name, code });
    }

    public readSketch(name: string) {
        return this._send<{ code: string }>("sketch.read", { name });
    }

    public writeSketch(name: string, code: string) {
        return this._send<{ ok: boolean }>("sketch.write", { name, code });
    }

    public deleteSketch(name: string) {
        return this._send<{ ok: boolean }>("sketch.delete", { name });
    }

    // ─── Compile & Upload ──────────────────────────────────────────

    public compile(sketch: string, fqbn: string, boardOption?: BoardOption) {
        return this._send<{ ok: boolean }>("compile", { sketch, fqbn, boardOption });
    }

    public upload(sketch: string, fqbn: string, port: string, boardOption?: BoardOption) {
        return this._send<{ ok: boolean }>("upload", { sketch, fqbn, port, boardOption });
    }

    // ─── Serial Port (New!) ────────────────────────────────────────

    public listPorts() {
        return this._send<PortProps[]>("port.list");
    }

    /**
     * เชื่อมต่อ Serial Port เพื่อรับ-ส่งข้อมูล
     * ข้อมูลที่ส่งกลับมาจากบอร์ดจะเข้าที่ callback `onPortData`
     */
    public connectPort(port: string, baudRate: number = 9600) {
        return this._send<{ ok: boolean }>("port.connect", { port, baudRate });
    }

    public disconnectPort(port: string) {
        return this._send<{ ok: boolean }>("port.disconnect", { port });
    }

    public writePort(port: string, data: any) {
        return this._send<{ ok: boolean }>("port.write", { port, data });
    }

    // ─── Misc ──────────────────────────────────────────────────────

    public getVersion() { return this._send<any>("version"); }

    public initConfig(additional_urls: string[] = []) {
        return this._send<{ ok: boolean }>("config.init", { additional_urls });
    }
}