import { WebSocketServer } from 'ws';
import {onSocketError, onConnection, onSocketClose, updateState, updatePosition} from '../controller/agvController.js';
import Route from '../class/route.js';
import {log} from '../config.js';

const agvServer = new WebSocketServer({noServer: true, path: '/agv'});
const route = new Route();

//Define every route on message receive
route.on('state', updateState);
route.on('notif', updatePosition);
//Upgrade http request to websocket
function onUpgrade({request, socket, head}){
    agvServer.handleUpgrade(request, socket, head, ws => {
        agvServer.emit('connection', ws, request);
    });
}
//When agv connected
agvServer.on('connection', function connection(ws, request, client) {
    const userId = request.headers['id'];
    //Only run once when agv connected
    onConnection(ws, request);
    //when receive message
    ws.on('message', function incoming(message) {
        try{
            let msg = JSON.parse(message.toString());
            route.call(msg.type, {data: msg?.data, agvId: userId});
        }catch(err){
            log.error([err]);
        }
    });
    //when error occured
    ws.on('error', onSocketError);
    //when agv connection closed
    ws.on('close', function close() {
        onSocketClose(ws, request);
    });
});

export {
    onUpgrade,
    agvServer
}