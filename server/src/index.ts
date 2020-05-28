import * as Express from 'express';
import * as HTTP from 'http';
import * as io from 'socket.io';
import * as Path from 'path';
import * as bodyParser from "body-parser";
import {RoomManager, RoomOptions} from './game/rooms';
import logger from "./logger";

const port = 8080;
const app = Express();
const http = HTTP.createServer(app);
const socket = io(http);
const roomManager = new RoomManager(socket);

app.use(bodyParser.text());
app.use('/js', Express.static(Path.resolve(__dirname, '../../frontend/dist')));
app.use('/js', Express.static(Path.resolve(__dirname, '../../node_modules/@popperjs/core/dist/umd')));
app.use('/', Express.static(Path.resolve(__dirname, '../../node_modules/bootstrap/dist')));
app.use('/js', Express.static(Path.resolve(__dirname, '../../node_modules/jquery/dist')));

app.post('/api/createlobby', (req, res, next) => {
    logger.log({
        level: 'info',
        message: `POST /api/createlobby - ${req.ip}`
    });
    let lobbyData: RoomOptions = JSON.parse(req.body);
    try {
        let room = roomManager.createRoom(lobbyData);
        res.json({
            pass: true,
            message: room.id
        });
    } catch (e) {
        res.json({
            pass: false,
            message: e.message
        });
    }
});

app.post('/api/getlobbies', (req, res) => {
    logger.log({
        level: 'info',
        message: `POST /api/getlobbies - ${req.ip}`
    });
    res.send(JSON.stringify(roomManager.getRooms()));
});

app.get('*', (req, res, next) => {
    logger.log({
        level: 'info',
        message: `GET * => index.html - ${req.ip}`
    });
    res.sendFile(Path.resolve(__dirname, '../../frontend/index.html'));
});

http.listen(port, () => {
    logger.log({
        level: 'info',
        message: `Listening on port ${port}`
    });
});
