"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Express = require("express");
var HTTP = require("http");
var io = require("socket.io");
var Path = require("path");
var bodyParser = require("body-parser");
var rooms_1 = require("./game/rooms");
var logger_1 = require("./logger");
var port = 8080;
var app = Express();
var http = HTTP.createServer(app);
var socket = io(http);
var roomManager = new rooms_1.RoomManager(socket);
app.use(bodyParser.text());
app.use('/js', Express.static(Path.resolve(__dirname, '../../frontend/dist')));
app.use('/js', Express.static(Path.resolve(__dirname, '../../node_modules/@popperjs/core/dist/umd')));
app.use('/', Express.static(Path.resolve(__dirname, '../../node_modules/bootstrap/dist')));
app.use('/js', Express.static(Path.resolve(__dirname, '../../node_modules/jquery/dist')));
app.post('/api/createlobby', function (req, res, next) {
    logger_1.default.log({
        level: 'info',
        message: "POST /api/createlobby - " + req.ip
    });
    var lobbyData = JSON.parse(req.body);
    try {
        var room = roomManager.createRoom(lobbyData);
        res.json({
            pass: true,
            message: room.id
        });
    }
    catch (e) {
        res.json({
            pass: false,
            message: e.message
        });
    }
});
app.post('/api/getlobbies', function (req, res) {
    logger_1.default.log({
        level: 'info',
        message: "POST /api/getlobbies - " + req.ip
    });
    res.send(JSON.stringify(roomManager.getRooms()));
});
app.get('*', function (req, res, next) {
    logger_1.default.log({
        level: 'info',
        message: "GET * => index.html - " + req.ip
    });
    res.sendFile(Path.resolve(__dirname, '../../frontend/index.html'));
});
http.listen(port, function () {
    logger_1.default.log({
        level: 'info',
        message: "Listening on port " + port
    });
});
//# sourceMappingURL=index.js.map