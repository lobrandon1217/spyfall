import Player from "./player";
import {getRandomPlace, places} from "./places";
import {Room} from "./rooms";

export class Game {
    room: Room;
    secondsLeft: number;
    paused: boolean;
    firstPlayer: string;  // name of first player to ask question
    spyPlayer: string; // name of spy player
    location: string;
    timer: NodeJS.Timeout;
    votes: {[playerid: string]: string};

    constructor(room: Room) {
        this.room = room;
        this.location = getRandomPlace();
        this.spyPlayer = this.getRandomPlayer().name;
        this.firstPlayer = this.getRandomPlayer().name;
        this.secondsLeft = 600;
        this.votes = {};
        for (let ply of room.players) { this.votes[ply.id] = ''; }
        this.resume();
        this.sendAllData();
    }

    getRandomPlayer(): Player {
        return this.room.players[Math.floor(Math.random() * this.room.players.length)];
    }

    pause() {
        this.paused = true;
        clearInterval(this.timer);
    }

    broadcast(event, data) {
        this.room.socket.to(this.room.id).emit(event, data);
    }

    sendLocationToPlayers() {
        for (let ply of this.room.players) {
            if (ply.name == this.spyPlayer) {
                // this player is the spy
                ply.socket.emit('location', {
                    'spy': true
                });
            } else {
                ply.socket.emit('location', {
                    'spy': false,
                    'location': this.location
                });
            }
        }
    }

    sendAllData() {
        this.sendLocationToPlayers();
        this.broadcast('game data', {
            firstPlayer: this.firstPlayer,
            votes: this.votes,
            allLocations: places
        });
    }

    resume() {
        this.paused = false;
        this.broadcast('time', this.secondsLeft);
        this.timer = setInterval(() => {
            if (this.secondsLeft == 0) {
                this.broadcast('chat message', 'SERVER: Time has ran out! The spy wins!');
                this.endGame(true);
            }
            this.secondsLeft -= 1;
            this.broadcast('time', this.secondsLeft);
        }, 1000);
    }

    endGame(winnerIsSpy: boolean) {
        this.broadcast('chat message', `${winnerIsSpy? 
            `SERVER: The spy won! The location was ${this.location}` : 
            `SERVER: Non-spies won! The location was ${this.location}`}`);
        this.room.endGame();
    }

    guess(location: string) {
        if (location == this.location) {
            return this.endGame(true);
        } else {
            return this.endGame(false);
        }
    }

    handleLeave(player: Player) {
        if (this.spyPlayer == player.name) {
            this.endGame(false);
        }
    }

    processAllVotes() {
        let result = {};
        Object.keys(this.votes).forEach(id => {
            if (this.votes[id] in result) {
                result[this.votes[id]] += 1;
            } else {
                result[this.votes[id]] = 1;
            }
        });

        Object.keys(result).forEach(name => {
            if (result[name] >= this.room.players.length - 1) {
                let player = this.room.players.find(ply => ply.name == name);
                if (!player) return;
                if (this.spyPlayer == player.name) {
                    this.broadcast('chat message', `SERVER: The spy has been voted out!`);
                    this.endGame(false);
                } else {
                    this.broadcast('chat message',
                        'SERVER: The non-spies have voted for the incorrect person!');
                    this.endGame(true);
                }
            }
        })
    }

    vote(src, dst) {
        let voting = this.room.players.find(ply => ply.id == src);
        let destinationPlayer = this.room.players.find(ply => ply.name == dst);
        if (!voting || !destinationPlayer) return;
        if (voting.id == destinationPlayer.id) {
            return voting.socket.emit('chat message', 'SERVER: You cannot vote for yourself');
        }
        if (src in this.votes && this.votes[src] == dst) {
            // already voting for it, just remove it
            this.votes[src] = '';
            this.broadcast('chat message', `${voting.name} removed their vote`);
        } else {
            this.votes[src] = dst;
            this.broadcast('chat message', `${voting.name} voted for ${destinationPlayer.name}`);
        }
        this.sendAllData();
        this.processAllVotes();
    }
}