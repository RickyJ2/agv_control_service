import { WebSocketServer } from 'ws';
import { onConnection, onSocketError, onSocketClose, receiveTask } from '../controller/backendController.js';
import Route from '../class/route.js';
import {log} from '../config.js';

const backendServer = new WebSocketServer({noServer: true, path: '/backend'});
const route = new Route();

//Define every route on message receive
route.on('task', receiveTask);
//Upgrade http request to websocket
function onUpgrade({request, socket, head}){
    backendServer.handleUpgrade(request, socket, head, ws => {
        backendServer.emit('connection', ws, request);
    });
}
//When dashboard connected
backendServer.on('connection', function connection(ws, request, client) {
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
    backendServer
}