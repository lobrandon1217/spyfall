"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Player = /** @class */ (function () {
    function Player(socket, name) {
        this.id = socket.id;
        this.socket = socket;
        this.name = name;
    }
    return Player;
}());
exports.default = Player;
//# sourceMappingURL=player.js.map