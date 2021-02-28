import Socket, { SocketEvents } from "facilmap-client";
import { EventHandler } from "facilmap-types";
import { Handler, Map } from "leaflet";
import { leafletToFmBbox } from "./utils/leaflet";

export default class BboxHandler extends Handler {

    client: Socket;

    constructor(map: Map, client: Socket) {
        super(map);
        this.client = client;
    }

    updateBbox(): void {
        this.client.updateBbox(leafletToFmBbox(this._map.getBounds(), this._map.getZoom()));
    }

    handleMoveEnd = (): void => {
        if (this.client.padId || this.client.route) {
            this.updateBbox();
        }
    }

    handleEmit: EventHandler<SocketEvents, "emit"> = (name, data) => {
        if (["setPadId", "setRoute"].includes(name)) {
            this.updateBbox();
        }
    }

    addHooks(): void {
        this._map.on("moveend", this.handleMoveEnd);
        this.client.on("emit", this.handleEmit);
    }

    removeHooks(): void {
        this._map.off("moveend", this.handleMoveEnd);
        this.client.removeListener("emit", this.handleEmit);
    }
}