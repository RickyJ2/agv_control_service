import {log, listAGVClient, listDashboardClient, map, finder} from '../config.js';
import {notifyAGV, notifyDashboard, sendMap} from '../websocketServer/util.js';
import { Hex, axialToXY } from '../class/hex.js';

//When socket error occured
function onSocketError(err) {
    log.error([err]);
}
//When dashboard connected run only once
function onConnection(ws, request){
    listDashboardClient.push(ws);
    log.info(['Dashboard connected']);
    sendMap(ws);
    setInterval(function(){
        let msg = {
          type: 'update',
          data: [
            listAGVClient['1'].getState(),
            listAGVClient['2'].getState()
          ]
        }
        notifyDashboard(JSON.stringify(msg));
    }, 1000); 
}
//When dashboard connection closed
function onSocketClose(ws, request) {
    let index = listDashboardClient.indexOf(ws);
    if(index != -1){
        listDashboardClient.splice(index, 1);
    }
    log.info(['Dashboard disconnected']);
}
//Receive task from dashboard, notify to AGV
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
    log.info(["Generating path: ", start.toString(), " to ", goal])
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
    map.setGridReserved(path.slice(0, path.length - 1));
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
//Send map to dashboard
function sendingMap({ws}){
    sendMap(ws)
}

export {
    onSocketError,
    onConnection,
    onSocketClose,
    
    receiveTask,
    sendingMap
}