"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
var places_1 = require("./places");
var Game = /** @class */ (function () {
    function Game(room) {
        this.room = room;
        this.location = places_1.getRandomPlace();
        this.spyPlayer = this.getRandomPlayer().name;
        this.firstPlayer = this.getRandomPlayer().name;
        this.secondsLeft = 600;
        this.votes = {};
        for (var _i = 0, _a = room.players; _i < _a.length; _i++) {
            var ply = _a[_i];
            this.votes[ply.id] = '';
        }
        this.resume();
        this.sendAllData();
    }
    Game.prototype.getRandomPlayer = function () {
        return this.room.players[Math.floor(Math.random() * this.room.players.length)];
    };
    Game.prototype.pause = function () {
        this.paused = true;
        clearInterval(this.timer);
    };
    Game.prototype.broadcast = function (event, data) {
        this.room.socket.to(this.room.id).emit(event, data);
    };
    Game.prototype.sendLocationToPlayers = function () {
        for (var _i = 0, _a = this.room.players; _i < _a.length; _i++) {
            var ply = _a[_i];
            if (ply.name == this.spyPlayer) {
                // this player is the spy
                ply.socket.emit('location', {
                    'spy': true
                });
            }
            else {
                ply.socket.emit('location', {
                    'spy': false,
                    'location': this.location
                });
            }
        }
    };
    Game.prototype.sendAllData = function () {
        this.sendLocationToPlayers();
        this.broadcast('game data', {
            firstPlayer: this.firstPlayer,
            votes: this.votes,
            allLocations: places_1.places
        });
    };
    Game.prototype.resume = function () {
        var _this = this;
        this.paused = false;
        this.broadcast('time', this.secondsLeft);
        this.timer = setInterval(function () {
            if (_this.secondsLeft == 0) {
                _this.broadcast('chat message', 'SERVER: Time has ran out! The spy wins!');
                _this.endGame(true);
            }
            _this.secondsLeft -= 1;
            _this.broadcast('time', _this.secondsLeft);
        }, 1000);
    };
    Game.prototype.endGame = function (winnerIsSpy) {
        this.broadcast('chat message', "" + (winnerIsSpy ?
            "SERVER: The spy won! The location was " + this.location :
            "SERVER: Non-spies won! The location was " + this.location));
        this.room.endGame();
    };
    Game.prototype.guess = function (location) {
        if (location == this.location) {
            return this.endGame(true);
        }
        else {
            return this.endGame(false);
        }
    };
    Game.prototype.handleLeave = function (player) {
        if (this.spyPlayer == player.name) {
            this.endGame(false);
        }
    };
    Game.prototype.processAllVotes = function () {
        var _this = this;
        var result = {};
        Object.keys(this.votes).forEach(function (id) {
            if (_this.votes[id] in result) {
                result[_this.votes[id]] += 1;
            }
            else {
                result[_this.votes[id]] = 1;
            }
        });
        Object.keys(result).forEach(function (name) {
            if (result[name] >= _this.room.players.length - 1) {
                var player = _this.room.players.find(function (ply) { return ply.name == name; });
                if (!player)
                    return;
                if (_this.spyPlayer == player.name) {
                    _this.broadcast('chat message', "SERVER: The spy has been voted out!");
                    _this.endGame(false);
                }
                else {
                    _this.broadcast('chat message', 'SERVER: The non-spies have voted for the incorrect person!');
                    _this.endGame(true);
                }
            }
        });
    };
    Game.prototype.vote = function (src, dst) {
        var voting = this.room.players.find(function (ply) { return ply.id == src; });
        var destinationPlayer = this.room.players.find(function (ply) { return ply.name == dst; });
        if (!voting || !destinationPlayer)
            return;
        if (voting.id == destinationPlayer.id) {
            return voting.socket.emit('chat message', 'SERVER: You cannot vote for yourself');
        }
        if (src in this.votes && this.votes[src] == dst) {
            // already voting for it, just remove it
            this.votes[src] = '';
            this.broadcast('chat message', voting.name + " removed their vote");
        }
        else {
            this.votes[src] = dst;
            this.broadcast('chat message', voting.name + " voted for " + destinationPlayer.name);
        }
        this.sendAllData();
        this.processAllVotes();
    };
    return Game;
}());
exports.Game = Game;
//# sourceMappingURL=game.js.map