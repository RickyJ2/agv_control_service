import { WebSocketServer } from 'ws';
import { onConnection, onSocketError, onSocketClose, receiveTask, sendingMap } from '../controller/dashboardController.js';
import Route from '../class/route.js';
import {log} from '../config.js';

const dashboardServer = new WebSocketServer({noServer: true, path: '/dashboard'});
const route = new Route();

//Define every route on message receive
route.on('task', receiveTask);
route.on('map', sendingMap);
//Upgrade http request to websocket
function onUpgrade({request, socket, head}){
    dashboardServer.handleUpgrade(request, socket, head, ws => {
        dashboardServer.emit('connection', ws, request);
    });
}
//When dashboard connected
dashboardServer.on('connection', function connection(ws, request, client) {
    //Only run once when dashboard connected
    onConnection(ws, request);
    //when receive message
    ws.on('message', function incoming(message) {
        try{
            let msg = JSON.parse(message.toString());
            route.call(msg.type, {data: msg?.data, ws: ws});
        }catch(err){
            log.error([err]);
        }
    });
    //when error occured
    ws.on('error', onSocketError);
    //when dashboard connection closed
    ws.on('close', function close() {
        onSocketClose(ws, request);
    });
});

export {
    onUpgrade,
    dashboardServer
}