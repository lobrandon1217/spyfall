import {Server} from 'socket.io';
import Player from "./player";
import logger from '../logger';
import * as SocketIO from "socket.io";
import validate = WebAssembly.validate;
import {Game} from "./game";

export interface RoomOptions {
    public: boolean;
    name: string;
}

export interface CleanRoom {
    /**
     * Used for returning room data in a lobby list request.
     * This is so that we can choose what information gets sent back.
     * @see RoomManager getRooms()
     */
    id: string;
    host: string;
}

export class Room {
    id: string;
    roomOptions: RoomOptions;
    players: Player[];
    socket: Server;
    host: string;
    roomManager: RoomManager;
    game: Game;
    currentState: number;  // 1 == lobby, 2 == ingame

    constructor(socket: Server, rm: RoomManager) {
        this.players = [];
        this.roomManager = rm;
        this.socket = socket;
        this.host = '';
        this.game = null;
        this.currentState = 1;
    }

    updateUsers() {
        let result = {
            host: this.host,
            players: this.players.map(value => value.name)
        };
        this.socket.to(this.id).emit('player list', result);
    }

    addPlayer(player: Player) {
        this.players.push(player);
        if (this.players.length == 1) {
            // now we have one player
            this.host = player.name;
        }
        this.updateUsers();
    }

    removePlayer(player: Player | string) {
        let id;
        if (player instanceof Player) {
            id = player.id;
        } else {
            id = player;
        }

        logger.log({
            level: 'info',
            message: `Removing player ${player} from game ${this.id}.`
        });

        let playerListIndex = this.players.findIndex(value => {
            return value.id == id;
        });
        let needNewHost = false;

        if (playerListIndex > -1) {
            if (this.players[playerListIndex].name) {
                // we need a new host
                needNewHost = true;
            }
            if (this.currentState == 2) {
                this.game.handleLeave(this.players[playerListIndex]);
            }
            this.socket.to(this.id).emit('chat message',
                `SERVER: ${this.players[playerListIndex].name} has left the game.`);
            this.players.splice(playerListIndex, 1);
        }

        if (this.players.length == 0) return this.roomManager.deleteRoom(this);
        if (needNewHost) {
            this.host = this.players[Math.floor(Math.random() * this.players.length)].name;
        }
        this.updateUsers();
    }

    hasPlayerName(name: string) {
        return this.players.filter(value => value.name.toLowerCase() == name.toLowerCase()).length > 0;
    }

    endGame() {
        this.game.pause();
        this.setState(1);
        this.game = null;
    }

    setState(state: number) {
        this.currentState = state;
        this.socket.to(this.id).emit('state', this.currentState);
    }
}

export class RoomManager {
    rooms: { [key: string]: Room };
    socket: Server;

    constructor(socket: SocketIO.Server) {
        this.socket = socket;
        this.rooms = {};

        this.useSocket();
    }

    generateCode(): string {
        let result;
        let letters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
        do {
            result = '';
            for (let i = 0; i < 6; i++) {
                result += letters.charAt(Math.floor(Math.random() * letters.length));
            }
        } while (this.rooms[result]);
        return result;
    }


    createRoom(roomOptions: RoomOptions): Room {
        logger.log({
            message: 'Creating new room',
            level: 'info'
        });
        // verify the name is good
        if (roomOptions.name.search(/^.{3,12}$/) < 0) {
            throw new Error(`Invalid name. Must be between 3 to 12 characters.`);
        }
        let newRoom = new Room(this.socket, this);
        newRoom.id = this.generateCode();
        newRoom.roomOptions = roomOptions;
        this.rooms[newRoom.id] = newRoom;
        let timeoutInMs = 5000;
        setTimeout(() => {
            if (newRoom.players.length == 0) {
                this.deleteRoom(newRoom);
                logger.log({
                    message: `Deleted room ${newRoom.id} after ${timeoutInMs}ms`,
                    level: 'info'
                });
            }
        }, timeoutInMs);
        return newRoom;
    }

    deleteRoom(room: Room | string): void {
        let id: string;
        if (room instanceof Room) {
            id = room.id;
        } else if (typeof room == "string") {
            id = room;
        } else {
            throw new Error("unknown type of room");
        }
        logger.log({
            level: 'info',
            message: `Deleting room id ${id}`
        });
        let roomObj = this.rooms[id];
        if (!roomObj) return;

        delete this.rooms[id];
    }

    getRooms() {
        let publicRooms: Room[] = Object.values(this.rooms)
            .filter(room => room.roomOptions.public && room.currentState == 1);
        let cleanRoomsArr: CleanRoom[] = publicRooms.map((val: Room) => {
            return {
                id: val.id,
                name: val.roomOptions.name,
                host: val.host
            };
        });
        return cleanRoomsArr;
    }

    useSocket() {
        logger.log({
            message: `Setting up socket initially...`,
            level: 'info'
        });
        let socket = this.socket;
        socket.on('connect', client => {
            let roomObj: Room = null;
            logger.log({
                message: `Socket '${client.id}' connected.`,
                level: 'info'
            });

            client.on('join', (room: string, name: string) => {
                logger.log({
                    level: 'info',
                    message: `Socket ${client.id} wants name ${name} in room ${room}`
                });
                if (name.search(/[a-zA-Z0-9_-]{3,12}/) < 0) {
                    return client.emit('server message',
                        'Invalid name. Valid names are 3-12 of these characters: a-z, 0-9, -, _');
                }
                if (room in this.rooms) {
                    // Checking for existing names
                    if (this.rooms[room].hasPlayerName(name)) {
                        return client.emit('server message', `The name '${name}' currently in use.`);
                    }
                    let player = new Player(client, name);
                    client.join(room);
                    client.emit('joined');
                    roomObj = this.rooms[room];
                    this.rooms[room].addPlayer(player);
                    client.emit('state', roomObj.currentState);
                    if (roomObj.currentState == 2) {
                        // in game, update the user's stuff
                        roomObj.game.sendAllData();
                    }
                    client.on('disconnect', () => {
                        this.rooms[room].removePlayer(player.id);
                    });
                    socket.to(roomObj.id)
                        .emit('chat message', `SERVER: ${player.name} has joined the game.`);
                } else {
                    return client.emit('server message', 'Invalid room ID. Please join a different game.');
                }
            });

            client.on('start', () => {
                if (roomObj.players.find(ply => ply.name == roomObj.host).socket.id == client.id) {
                    // this player is the host trying to start
                    roomObj.game = new Game(roomObj);
                    roomObj.setState(2);
                }
            });

            client.on('chat message', message => {
                let user = roomObj.players.find(ply => ply.id == client.id);
                if (!user) return;
                roomObj.socket.to(roomObj.id).emit('chat message', `${user.name}: ${message}`);
            });

            // player voting on someone
            client.on('vote', (name: string) => {
                logger.log({
                    level: 'info',
                    message: `Socket ${client.id} is voting for ${name}`
                });
                roomObj.game.vote(client.id, name)
            });

            // player pausing
            client.on('timer click', () => {
                if (roomObj.game.paused) {
                    roomObj.game.resume();
                } else {
                    roomObj.game.pause();
                }
            });

            // spy guessing location
            client.on('guess', (loc: string) => {
                if (roomObj.game.spyPlayer == roomObj.players.find(ply => ply.id == client.id).name) {
                    roomObj.game.guess(loc);
                }
            });

            client.on('disconnect',  reason => {
                logger.log({
                    message: `Socket ${client.id} disconnected: ${reason}`,
                    level: 'info'
                });
            });
        });

        logger.log({
            level: 'info',
            message: 'Socket finished setup.'
        });
    }
}

