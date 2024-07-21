import {log, listAGVClient, map, finder} from '../config.js';
import {notifyAGV, notifyBackend, sendAGVPosition, sendMapToAll} from '../websocketServer/util.js';
import { xyToAxial, axialToXY, Hex } from '../class/hex.js';

function onSocketError(err) {
    log.error([err]);
}

function onConnection(ws, request){
    const agvId = request.headers['id'];
    listAGVClient[agvId].setWs(ws);
    log.info(['AGV ' + agvId + ' connected']);
    sendAGVPosition(agvId);
}

function onSocketClose(_, request) {
    const agvId = request.headers['id'];
    listAGVClient[agvId].setWs(null);
    log.info(['AGV ' + agvId + ' disconnected']);
}

function updateState({data, agvId}){
    //convert position from xy to axial
    data.position = xyToAxial(data.position.x, data.position.y);
    listAGVClient[agvId].updateState(data);
}

function updatePosition({agvId}){
    if (listAGVClient[agvId].listPath.length == 0) return;
    if (listAGVClient[agvId].listPath[0].length == 0){
        listAGVClient[agvId].listPath.shift();
        listAGVClient[agvId].listGoalPoint.shift();
        listAGVClient[agvId].listTaskCode.shift();
        log.info(["AGV ", agvId, " emptying..."]);
        return;
    };
    let point = listAGVClient[agvId].listPath[0].shift();
    if(listAGVClient[agvId].listPath[0].length == 0){
        listAGVClient[agvId].listPath.shift();
        listAGVClient[agvId].listGoalPoint.shift();
        let taskCode = listAGVClient[agvId].listTaskCode.shift();
        let msg = {
            "type": taskCode.type,
            "data":{
                "id_agv": agvId,
                "task_code": taskCode.code
            }
        }
        notifyBackend(JSON.stringify(msg));
        log.info(["AGV ", agvId, " finished task: ", taskCode.code]);
    }
    log.info(["AGV ", agvId, " reached point: ", point]);
}

function handleCollision({data, agvId}){
    let obsInHex = data.map(obs => xyToAxial(obs.x, obs.y));
    map.setObstacles(obsInHex);
    sendMapToAll()
    let start = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
    let end = map.getHexAt(listAGVClient[agvId].listGoalPoint[0].x, listAGVClient[agvId].listGoalPoint[0].y);
    let path = finder.findPath(start.x, start.y, end.x, end.y, map.clone());
    if(path.length == 0){
        log.info(["no path found"]);
        return;
    }
    path.shift(); //remove start point
    //remove old path and add new path
    listAGVClient[agvId].listPath.shift();
    listAGVClient[agvId].listPath.unshift(path);
    //convert path to xy coordinate system
    path = path.map(node => axialToXY(new Hex(node[0], node[1])));
    log.info(["generated path: ", path]);
    let NewMsg = {
        type: 'newPath',
        data: {
            "path": path
        }
    }
    notifyAGV(JSON.stringify(NewMsg), agvId);
}

export {
    onSocketError,
    onConnection,
    onSocketClose,

    updateState,
    updatePosition,
    handleCollision
}