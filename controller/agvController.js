import {log, listAGVClient, map} from '../config.js';
import {sendAGVPosition} from '../websocketServer/util.js';
import { xyToAxial } from '../class/hex.js';

function onSocketError(err) {
    log.error([err]);
}

function onConnection(ws, request){
    const agvId = request.headers['id'];
    listAGVClient[agvId].setWs(ws);
    log.info(['AGV ' + agvId + ' connected']);
    sendAGVPosition(agvId);
}

function onSocketClose(ws, request) {
    const agvId = request.headers['id'];
    listAGVClient[agvId].setWs(null);
    log.info(['AGV ' + agvId + ' disconnected']);
}

function updateState({data, agvId}){
    //convert position from xy to axial
    data.position = xyToAxial(data.position.x, data.position.y);
    listAGVClient[agvId].updateState(data);
}

function updatePosition({data, agvId}){
    if (listAGVClient[agvId].listPath.length == 0) return;
    if (listAGVClient[agvId].listPath[0].length == 0) return;
    let point = listAGVClient[agvId].listPath[0].shift();
    // listAGVClient[agvId].setPosition(point[0], point[1]);
    // log.info(["AGV updated Position: ", listAGVClient[agvId].position]); 
    // sendAGVPosition(agvId);
    if(listAGVClient[agvId].listPath[0].length == 0){
        listAGVClient[agvId].listPath.shift();
        listAGVClient[agvId].listGoalPoint.shift();
    }
    map.setGridUnreserved([point]);
    log.info(["reached point: ", point]);
}

export {
    onSocketError,
    onConnection,
    onSocketClose,

    updateState,
    updatePosition
}