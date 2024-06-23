import {log, listAGVClient, listBackendClient, map, finder} from '../config.js';
import {notifyAGV, notifyBackend} from '../websocketServer/util.js';
import { Hex, axialToXY } from '../class/hex.js';

//When socket error occured
function onSocketError(err) {
    log.error([err]);
}
//When Backend connected run only once
function onConnection(ws, _){
    listBackendClient.push(ws);
    log.info(['Backend connected']);
    setInterval(function(){
        let msg = {
          type: 'update',
          data: [
            listAGVClient['1'].getStateBackend(),
            listAGVClient['2'].getStateBackend()
          ]
        }
        notifyBackend(JSON.stringify(msg));
    }, 1000); 
}
//When Backend connection closed
function onSocketClose(ws, _) {
    let index = listBackendClient.indexOf(ws);
    if(index != -1){
        listBackendClient.splice(index, 1);
    }
    log.info(['Backend disconnected']);
}
//Receive task from Backend, notify to AGV
function receiveTask({data}){
    log.info(["received task ", data]);
    let agvId = data.id;
    let goal = data.goal;
    //generate Path for AGV
    let start = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
    if(listAGVClient[agvId].listGoalPoint.length > 0){
        let index = listAGVClient[agvId].listGoalPoint.length - 1;
        start = map.getHexAt(listAGVClient[agvId].listGoalPoint[index].x, listAGVClient[agvId].listGoalPoint[index].y);
    }
    log.info(["Generating path: ", start, " to ", goal])
    let end = map.getHexAt(goal.x, goal.y);
    if(end == null){
        log.info(["goal is invalid"]);
        return;
    }
    let path = finder.findPath(start.x, start.y, end.x, end.y, map.clone());
    if(path.length == 0){
        log.info(["no path found"]);
        return;
    }
    path.shift(); //remove start point
    listAGVClient[agvId].addTask(goal, path);
    //convert path to xy coordinate system
    path = path.map(node => axialToXY(new Hex(node[0], node[1])));
    log.info(["generated path: ", path]);
    goal = axialToXY(goal);
    let NewMsg = {
        type: 'path',
        data: {
            "path": path,
            "goal": goal
        }
    }
    notifyAGV(JSON.stringify(NewMsg), agvId);
}

export {
    onSocketError,
    onConnection,
    onSocketClose,
    
    receiveTask
}