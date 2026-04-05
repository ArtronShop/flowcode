export interface StreamPayload {
    stream: string;
    data: string;
}

export interface PortDataPayload {
    port: string;
    data: any;
}

export interface BoardOption {
    [key: string]: string;
}

export interface WsMessage {
    id?: string;
    type: "result" | "stream" | "error" | "port.data" | "port.close";
    payload: any;
}

export type PortProps = {
    path: string;
    manufacturer: string;
    friendlyName: string;
    vendorId: string;
    productId: string;
}
