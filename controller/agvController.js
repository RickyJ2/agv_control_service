import {log, listAGVClient, map, finder} from '../config.js';
import {notifyAGV, sendAGVPosition, sendMapToAll} from '../websocketServer/util.js';
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
    if (listAGVClient[agvId].listPath[0].length == 0) return;
    let point = listAGVClient[agvId].listPath[0].shift();
    if(listAGVClient[agvId].listPath[0].length == 0){
        listAGVClient[agvId].listPath.shift();
        listAGVClient[agvId].listGoalPoint.shift();
    }
    log.info(["AGV ", agvId, " reached point: ", point]);
}

function handleCollision({data, agvId}){
    let obsInHex = data.map(obs => xyToAxial(obs.x, obs.y));
    obsInHex = obsInHex.filter((obs, index, self) => self.findIndex(t => t.x === obs.x && t.y === obs.y) === index);
    map.setObstacles(obsInHex);
    log.info(["Obstacle detected at: ", obsInHex])
    sendMapToAll()
    log.info(["Regenerate new Path"]);
    let start = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
    let end = map.getHexAt(listAGVClient[agvId].listGoalPoint[0].x, listAGVClient[agvId].listGoalPoint[0].y);
    let path = finder.findPath(start.x, start.y, end.x, end.y, map.clone());
    if(path.length == 0){
        log.info(["no path found"]);
        return;
    }
    //convert path to xy coordinate system
    let pathXY = path.map(node => axialToXY(new Hex(node[0], node[1])));
    log.info(["generated path: ", path]);
    let NewMsg = {
        type: 'newPath',
        data: {
            "path": pathXY
        }
    }
    path.shift(); //remove start point
    //remove old path and add new path
    listAGVClient[agvId].listPath.shift();
    listAGVClient[agvId].listPath.unshift(path);
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