"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = exports.Room = void 0;
var player_1 = require("./player");
var logger_1 = require("../logger");
var game_1 = require("./game");
var Room = /** @class */ (function () {
    function Room(socket, rm) {
        this.players = [];
        this.roomManager = rm;
        this.socket = socket;
        this.host = '';
        this.game = null;
        this.currentState = 1;
    }
    Room.prototype.updateUsers = function () {
        var result = {
            host: this.host,
            players: this.players.map(function (value) { return value.name; })
        };
        this.socket.to(this.id).emit('player list', result);
    };
    Room.prototype.addPlayer = function (player) {
        this.players.push(player);
        if (this.players.length == 1) {
            // now we have one player
            this.host = player.name;
        }
        this.updateUsers();
    };
    Room.prototype.removePlayer = function (player) {
        var id;
        if (player instanceof player_1.default) {
            id = player.id;
        }
        else {
            id = player;
        }
        logger_1.default.log({
            level: 'info',
            message: "Removing player " + player + " from game " + this.id + "."
        });
        var playerListIndex = this.players.findIndex(function (value) {
            return value.id == id;
        });
        var needNewHost = false;
        if (playerListIndex > -1) {
            if (this.players[playerListIndex].name) {
                // we need a new host
                needNewHost = true;
            }
            if (this.currentState == 2) {
                this.game.handleLeave(this.players[playerListIndex]);
            }
            this.socket.to(this.id).emit('chat message', "SERVER: " + this.players[playerListIndex].name + " has left the game.");
            this.players.splice(playerListIndex, 1);
        }
        if (this.players.length == 0)
            return this.roomManager.deleteRoom(this);
        if (needNewHost) {
            this.host = this.players[Math.floor(Math.random() * this.players.length)].name;
        }
        this.updateUsers();
    };
    Room.prototype.hasPlayerName = function (name) {
        return this.players.filter(function (value) { return value.name.toLowerCase() == name.toLowerCase(); }).length > 0;
    };
    Room.prototype.endGame = function () {
        this.game.pause();
        this.setState(1);
        this.game = null;
    };
    Room.prototype.setState = function (state) {
        this.currentState = state;
        this.socket.to(this.id).emit('state', this.currentState);
    };
    return Room;
}());
exports.Room = Room;
var RoomManager = /** @class */ (function () {
    function RoomManager(socket) {
        this.socket = socket;
        this.rooms = {};
        this.useSocket();
    }
    RoomManager.prototype.generateCode = function () {
        var result;
        var letters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
        do {
            result = '';
            for (var i = 0; i < 6; i++) {
                result += letters.charAt(Math.floor(Math.random() * letters.length));
            }
        } while (this.rooms[result]);
        return result;
    };
    RoomManager.prototype.createRoom = function (roomOptions) {
        var _this = this;
        logger_1.default.log({
            message: 'Creating new room',
            level: 'info'
        });
        // verify the name is good
        if (roomOptions.name.search(/^.{3,12}$/) < 0) {
            throw new Error("Invalid name. Must be between 3 to 12 characters.");
        }
        var newRoom = new Room(this.socket, this);
        newRoom.id = this.generateCode();
        newRoom.roomOptions = roomOptions;
        this.rooms[newRoom.id] = newRoom;
        var timeoutInMs = 5000;
        setTimeout(function () {
            if (newRoom.players.length == 0) {
                _this.deleteRoom(newRoom);
                logger_1.default.log({
                    message: "Deleted room " + newRoom.id + " after " + timeoutInMs + "ms",
                    level: 'info'
                });
            }
        }, timeoutInMs);
        return newRoom;
    };
    RoomManager.prototype.deleteRoom = function (room) {
        var id;
        if (room instanceof Room) {
            id = room.id;
        }
        else if (typeof room == "string") {
            id = room;
        }
        else {
            throw new Error("unknown type of room");
        }
        logger_1.default.log({
            level: 'info',
            message: "Deleting room id " + id
        });
        var roomObj = this.rooms[id];
        if (!roomObj)
            return;
        delete this.rooms[id];
    };
    RoomManager.prototype.getRooms = function () {
        var publicRooms = Object.values(this.rooms)
            .filter(function (room) { return room.roomOptions.public && room.currentState == 1; });
        var cleanRoomsArr = publicRooms.map(function (val) {
            return {
                id: val.id,
                name: val.roomOptions.name,
                host: val.host
            };
        });
        return cleanRoomsArr;
    };
    RoomManager.prototype.useSocket = function () {
        var _this = this;
        logger_1.default.log({
            message: "Setting up socket initially...",
            level: 'info'
        });
        var socket = this.socket;
        socket.on('connect', function (client) {
            var roomObj = null;
            logger_1.default.log({
                message: "Socket '" + client.id + "' connected.",
                level: 'info'
            });
            client.on('join', function (room, name) {
                logger_1.default.log({
                    level: 'info',
                    message: "Socket " + client.id + " wants name " + name + " in room " + room
                });
                if (name.search(/[a-zA-Z0-9_-]{3,12}/) < 0) {
                    return client.emit('server message', 'Invalid name. Valid names are 3-12 of these characters: a-z, 0-9, -, _');
                }
                if (room in _this.rooms) {
                    // Checking for existing names
                    if (_this.rooms[room].hasPlayerName(name)) {
                        return client.emit('server message', "The name '" + name + "' currently in use.");
                    }
                    var player_2 = new player_1.default(client, name);
                    client.join(room);
                    client.emit('joined');
                    roomObj = _this.rooms[room];
                    _this.rooms[room].addPlayer(player_2);
                    client.emit('state', roomObj.currentState);
                    if (roomObj.currentState == 2) {
                        // in game, update the user's stuff
                        roomObj.game.sendAllData();
                    }
                    client.on('disconnect', function () {
                        _this.rooms[room].removePlayer(player_2.id);
                    });
                    socket.to(roomObj.id)
                        .emit('chat message', "SERVER: " + player_2.name + " has joined the game.");
                }
                else {
                    return client.emit('server message', 'Invalid room ID. Please join a different game.');
                }
            });
            client.on('start', function () {
                if (roomObj.players.find(function (ply) { return ply.name == roomObj.host; }).socket.id == client.id) {
                    // this player is the host trying to start
                    roomObj.game = new game_1.Game(roomObj);
                    roomObj.setState(2);
                }
            });
            client.on('chat message', function (message) {
                var user = roomObj.players.find(function (ply) { return ply.id == client.id; });
                if (!user)
                    return;
                roomObj.socket.to(roomObj.id).emit('chat message', user.name + ": " + message);
            });
            // player voting on someone
            client.on('vote', function (name) {
                logger_1.default.log({
                    level: 'info',
                    message: "Socket " + client.id + " is voting for " + name
                });
                roomObj.game.vote(client.id, name);
            });
            // player pausing
            client.on('timer click', function () {
                if (roomObj.game.paused) {
                    roomObj.game.resume();
                }
                else {
                    roomObj.game.pause();
                }
            });
            // spy guessing location
            client.on('guess', function (loc) {
                if (roomObj.game.spyPlayer == roomObj.players.find(function (ply) { return ply.id == client.id; }).name) {
                    roomObj.game.guess(loc);
                }
            });
            client.on('disconnect', function (reason) {
                logger_1.default.log({
                    message: "Socket " + client.id + " disconnected: " + reason,
                    level: 'info'
                });
            });
        });
        logger_1.default.log({
            level: 'info',
            message: 'Socket finished setup.'
        });
    };
    return RoomManager;
}());
exports.RoomManager = RoomManager;
//# sourceMappingURL=rooms.js.map