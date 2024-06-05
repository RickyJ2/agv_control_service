import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import AGV from './class/agv.js';
import Map from './class/map.js';
import aStarFinder from './class/aStarFinder.js';
import logging from './class/logging.js';

const log = new logging();
const listAGVClient = {
  '1': new AGV(1, {x: 0, y: 0}),
  '2': new AGV(2, {x: 0, y: 0}),
};
let listDashboardClient = [];
const map = new Map();
const finder = new aStarFinder();
const server = createServer();
const wss = new WebSocketServer({noServer: true });

function onSocketError(err) {
  log.error([err]);
}

function sendAGVPosition(agvId){
  let msg = {
    type: 'position',
    data: listAGVClient[agvId].position
  };
  notifyAGV(JSON.stringify(msg), agvId);
}

function notifyAGV(message, agvId = null){
  //For targeted AGV id
  if(agvId != null){
    if(listAGVClient[agvId].ws == null){
      log.error(["AGV not connected"]);
      return;
    }
    if(listAGVClient[agvId].ws.readyState === WebSocket.OPEN){
      listAGVClient[agvId].ws.send(message);
    }
    return;
  }
  //broadcast to all AGV
  listAGVClient.keys().forEach(function each(agvId) {
    if(listAGVClient[agvId].ws.readyState === WebSocket.OPEN){
      listAGVClient[agvId].ws.send(message);
    }
  });
}

function notifyDashboard(message){
  //broadcast to all Dashboard
  listDashboardClient.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function sendMapToAll(){
  listDashboardClient.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      sendMap(client);
    }
  });
};

function sendMap(client){
  let msg = {
    type: 'map',
    data: {
      "width": map.width,
      "height": map.height,
      "obs" : map.getObstacles()
    }   
  }
  client.send(JSON.stringify(msg));
}

wss.on('connection', function connection(ws, request, client) {
  const userId = request.headers['id'];
  switch(request.url){
    case('/agv'):{
      listAGVClient[userId].setWs(ws);
      log.info(['AGV ' + userId + ' connected']);
      sendAGVPosition(userId);
      break;
    }
    case('/dashboard'):{
      listDashboardClient.push(ws);
      log.info(['A Dashboard connected']);
      sendMap(ws);
      //run send msg to dashboard every 1s
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
      break;
    }
  }

  ws.on('message', function message(data) {
    let msg = JSON.parse(data.toString());
    switch(request.url){
      case('/agv'):{
        switch(msg.type){
          case("state"):{
            listAGVClient[userId].updateState(msg.data);
            break;
          }
          case("notif"):{
            let point = listAGVClient[userId].listPath[0].shift();
            listAGVClient[userId].setPosition(point[0], point[1]);
            log.info(["AGV updated Position: ", listAGVClient[userId].position]); 
            sendAGVPosition(userId);
            if(listAGVClient[userId].listPath[0].length == 0){
              listAGVClient[userId].listPath.shift();
              listAGVClient[userId].listGoalPoint.shift();
            }
            map.setGridUnreserved([point]);
            log.info(["reached point: ", point]);
            log.info(["current list Path: ", listAGVClient[userId].listPath]);
            log.info(["current list goal: ", listAGVClient[userId].listGoalPoint]);
            break;
          }
          case("collision"):{
            log.info("collision detected");
            msg.data.localMap.forEach(point => {
              let x = point.x + listAGVClient[userId].position.x;
              let y = point.y + listAGVClient[userId].position.y;
              map.addObstacle(x, y);
              log.info(["add obstacle at: ", x, y])
            });
            sendMapToAll();
            let start = map.getHexAt(listAGVClient[userId].position.x, listAGVClient[userId].position.y);
            let end = map.getHexAt(listAGVClient[userId].listGoalPoint[0].x, listAGVClient[userId].listGoalPoint[0].y);
            log.info(["when generating path: ", start, " to ", end])
            let path = finder.findPath(start.x, start.y, end.x, end.y, map.clone());
            path.shift(); //remove start point
            listAGVClient[userId].listPath.shift();
            listAGVClient[userId].listPath.unshift(path);
            path = path.map(node => ([node[0] - start.x, node[1] - start.y]));  
            let NewMsg = {
              type: 'new path',
              data: {
                "path": path,
                "goal": listAGVClient[userId].listGoalPoint[0]
              }
            }
            notifyAGV(JSON.stringify(NewMsg), userId);
            break;
          }
        }
        break;
      }
      case('/dashboard'):{
        switch(msg.type){
          case("task"):{
            log.info(["received task ", msg.data]);
            let agvId = msg.data.id;
            let goal = msg.data.goal;
            //generate Path for AGV
            let start = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
            if(listAGVClient[agvId].listGoalPoint.length > 0){
              let index = listAGVClient[agvId].listGoalPoint.length - 1;
              start = map.getHexAt(listAGVClient[agvId].listGoalPoint[index].x, listAGVClient[agvId].listGoalPoint[index].y);
            }
            log.info(["when generating path: ", start.toString(), " to ", goal])
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
            log.info(["generated path: ", path]);
            path.shift(); //remove start point
            listAGVClient[agvId].addTask(goal, path);
            map.setGridReserved(path.slice(0, path.length - 1));
            log.info(["current reserve grid: ", map.getReserveGrid()]);
            // path = path.map(node => ([node[0] - start.x, node[1] - start.y]));
            let NewMsg = {
              type: 'path',
              data: {
                "path": path,
                "goal": goal
              }
            }
            notifyAGV(JSON.stringify(NewMsg), agvId);
            break;
          }
          case("map"):{
            sendMap(ws);
            break;
          }
        }
        break;
      }
    }
  });

  ws.on('error', onSocketError);

  ws.on("close", function close() {
    switch(request.url){
      case('/agv'):{
        listAGVClient[userId].setWs(null);
        log.info(['AGV ' + userId + ' disconnected']);
        break;
      }
      case('/dashboard'):{
        listDashboardClient = listDashboardClient.filter(function(client) {
          return client !== ws;
        });
        log.info(['Dashboard disconnected'])
        break;
      }
    }
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function (ws) {
    wss.emit('connection', ws, request);
  });
});

server.listen(8080, function(_){
  log.info(['Server started on port 8080']);
});
