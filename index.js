import { createServer } from 'http';
import { onUpgrade as agvOnUpgrade } from './websocketServer/agvWebsocketServer.js';
import { onUpgrade as dashboardOnUpgrade } from './websocketServer/dashboardWebsocketServer.js';
import { log, PORT } from './config.js';
import Route from "./class/route.js";

const route = new Route();
const server = createServer();

//define the route
route.on('/agv', agvOnUpgrade);
route.on('/dashboard', dashboardOnUpgrade);
//handle invalid url
route.onUndefined(function({request, socket}){
    socket.write('HTTP/1.1 404 Bad Request\r\n\r\n');
    socket.destroy();
    log.error(['Invalid URL ' + request.url + ' for upgrade']);
});
//Upgrade the http request to websocket
server.on('upgrade', function upgrade(request, socket, head) {
    route.call(request.url, {request: request, socket: socket, head: head});
});
//start the server
server.listen(PORT, function(){
    log.info(['Server started on port ' + PORT])
});