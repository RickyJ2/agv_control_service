import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import AGV from './class/agv.js';
import Map from './class/map.js';
import aStarFinder from './class/aStarFinder.js';

let listAGVClient = {
  '1': new AGV(1, {x: 3, y: -1}),
  '2': new AGV(2, {x: 0, y: 0}),
};
let listDashboardClient = [];
let map = new Map();
let finder = new aStarFinder();

function onSocketError(err) {
  console.error(err);
}

function sendAGVPosition(agvId){
  let msg = {
    type: 'position',
    data: listAGVClient[agvId].position
  };
  notifyAGV(JSON.stringify(msg), agvId);
}

function notifyAGV(message, agvId){
  //For targeted AGV id
  if(agvId != 0){
    let client = listAGVClient[agvId].ws;
    if(client == null){
      console.log("AGV not connected");
      return;
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
    return;
  }
  //broadcast to all AGV
  let listAGV = listAGVClient.keys();
  listAGV.forEach(function each(agvId) {
    let client = listAGVClient[agvId].ws;
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
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
  // console.log("sending map: ", msg.data)
  client.send(JSON.stringify(msg));
}

const server = createServer();
const wss = new WebSocketServer({noServer: true });

wss.on('connection', function connection(ws, request, client) {
  const userId = request.headers['id'];
  // Check if the client is AGV or Dashboard
  if(request.url === '/agv'){
    listAGVClient[userId].setWs(ws);
    console.log('AGV ' + userId + ' connected');
    sendAGVPosition(userId);
  }else if(request.url === '/dashboard'){
    listDashboardClient.push(ws);
    console.log('Dashboard connected');
    //send map
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
  }

  ws.on('error', onSocketError);

  ws.on('message', function message(data) {
    if(request.url === '/agv'){
      let msg = JSON.parse(data.toString());
      if(msg.type === "state"){
        listAGVClient[userId].updateState(msg.data);
        map.clearMap()
        msg.data.localMap.forEach(point => {
          let x = point.x + listAGVClient[userId].position.x;
          let y = point.y + listAGVClient[userId].position.y;
          map.addObstacle(x, y);
        });
        sendMapToAll();
      }else if(msg.type == "notif"){
        if(msg.data === "point"){
          let point = listAGVClient[userId].listPath[0].shift();
          listAGVClient[userId].setPosition(point[0], point[1]);
          console.log("AGV updated Position: ",listAGVClient[userId].position)
          sendAGVPosition(userId);
          if(listAGVClient[userId].listPath[0].length == 0){
            listAGVClient[userId].listPath.shift();
            listAGVClient[userId].listGoalPoint.shift();
          }
          console.log("reached point: ", point);
          console.log("current list Path: ", listAGVClient[userId].listPath);
          console.log("current list goal: ", listAGVClient[userId].listGoalPoint);
          // let sendMsg = {
          //   "type": "stop"
          // }
          // notifyAGV(JSON.stringify(sendMsg), userId);
        }
      }
    }else if(request.url === '/dashboard'){
      let msg = JSON.parse(data.toString());
      if(msg.type === "task"){
        console.log("received task ", msg.data);
        let agvId = msg.data.id;
        let goal = msg.data.goal;
        //generatePath for AGV
        let start = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
        if(listAGVClient[agvId].listGoalPoint.length > 0){
          let index = listAGVClient[agvId].listGoalPoint.length - 1;
          start = map.getHexAt(listAGVClient[agvId].listGoalPoint[index].x, listAGVClient[agvId].listGoalPoint[index].y);
        }
        console.log("when generating path: ", start, " to ", goal)
        let end = map.getHexAt(goal.x, goal.y);
        if(end == null){
          console.log("goal is invalid");
          return;
        }
        let path = finder.findPath(start.x, start.y, end.x, end.y, map.clone());
        console.log("generated path: ", path)
        path.shift(); //remove start point
        listAGVClient[agvId].addTask(goal, path);
        path = path.map(node => ([node[0] - start.x, node[1] - start.y]));
        let NewMsg = {
          type: 'path',
          data: {
            "path": path,
            "goal": goal
          }
        }
        notifyAGV(JSON.stringify(NewMsg), agvId);
      }else if(msg.type === "map"){
        sendMap(ws);
      }
    }
  });

  ws.on("close", function close() {
    if(request.url === '/agv'){
      listAGVClient[userId].setWs(null);
      console.log('AGV ' + userId + ' disconnected');
    }else if(request.url === '/dashboard'){
      listDashboardClient = listDashboardClient.filter(function(client) {
        return client !== ws;
      });
      console.log('Dashboard disconnected')
    }
  });
});
/*
  pass: 1234
*/
server.on('upgrade', function upgrade(request, socket, head) {
  // if(request.headers['websocketpass']?.toString() != '1234'){
  //   socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  //   socket.destroy();
  //   return;
  // }
  wss.handleUpgrade(request, socket, head, function (ws) {
    wss.emit('connection', ws, request);
  });
});

server.listen(8080, function(err){
  console.log(err, server.address())
});
