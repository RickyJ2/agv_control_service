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
    let taskCode = data.task_code;
    let agvId = data.id_agv;
    let start = data.goal_start;
    let goal = data.goal_destination;
    //generate Path for AGV
    let agvPos = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
    if(listAGVClient[agvId].listGoalPoint.length > 0){
        let index = listAGVClient[agvId].listGoalPoint.length - 1;
        agvPos = map.getHexAt(listAGVClient[agvId].listGoalPoint[index].x, listAGVClient[agvId].listGoalPoint[index].y);
    }
    let startHex = map.getHexAt(start.x, start.y);
    let goalHex = map.getHexAt(goal.x, goal.y);
    if(startHex == null || goalHex == null){
        log.info(["start or goal is invalid"]);
        return;
    }
    let pathStart = finder.findPath(agvPos.x, agvPos.y, startHex.x, startHex.y, map.clone());
    let pathGoal = finder.findPath(startHex.x, startHex.y, goalHex.x, goalHex.y, map.clone());
    if(pathStart.length == 0 || pathGoal.length == 0){
        log.info(["no path found"]);
        return;
    }
    pathStart.shift(); //remove start point
    pathGoal.shift(); //remove start point
    listAGVClient[agvId].addTask(taskCode, start, goal, pathStart, pathGoal);
    //convert path to xy coordinate system
    pathStart = pathStart.map(node => axialToXY(new Hex(node[0], node[1])));
    pathGoal = pathGoal.map(node => axialToXY(new Hex(node[0], node[1])));
    log.info(["generated path: ", pathStart, pathGoal]);
    start = axialToXY(start);
    goal = axialToXY(goal);
    let NewMsg = {
        type: 'path',
        data: {
            "path": pathStart,
            "goal": start
        }
    }
    notifyAGV(JSON.stringify(NewMsg), agvId);
    NewMsg = {
        type: 'path',
        data: {
            "path": pathGoal,
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