import * as SocketIO from "socket.io";

export default class Player {
    id: string;
    name: string;
    socket: SocketIO.Socket;

    constructor(socket: SocketIO.Socket, name: string) {
        this.id = socket.id;
        this.socket = socket;
        this.name = name;
    }
}