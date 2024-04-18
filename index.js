import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import AGV from './class/agv.js';
import Map from './class/map.js';
import aStarFinder from './class/aStarFinder.js';

let listAGVClient = {
  '1': new AGV(1),
  '2': new AGV(2),
};
let listDashboardClient = [];
let map = new Map();
let finder = new aStarFinder();

function onSocketError(err) {
  console.error(err);
}

function notifyAGV(message, agvId){
  //For targeted AGV id
  if(agvId != 0){
    let client = listAGVClient[agvId].ws;
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

const server = createServer();
const wss = new WebSocketServer({noServer: true });

wss.on('connection', function connection(ws, request, client) {
  const userId = request.headers['id'];
  // Check if the client is AGV or Dashboard
  if(request.url === '/agv'){
    listAGVClient[userId].setWs(ws);
    console.log('AGV ' + userId + ' connected');
  }else if(request.url === '/dashboard'){
    listDashboardClient.push(ws);
    console.log('Dashboard connected');
    //run send msg to dashboard every 1s
    setInterval(function(){
      let msg = {
        type: 'update',
        data: {
          '1': listAGVClient['1'].getState(),
          '2': listAGVClient['2'].getState()
        }
      }
      notifyDashboard(JSON.stringify(msg));
    }, 1000);
  }

  ws.on('error', onSocketError);

  ws.on('message', function message(data) {
    if(request.url === '/agv'){
      data = JSON.parse(data.toString());
      listAGVClient[userId].updateState(data);
    }else if(request.url === '/dashboard'){
      let msg = JSON.parse(data.toString());
      if(msg.type === "task"){
        let agvId = msg.data.id;
        let goal = msg.data.goal;
        //generatePath for AGV
        let start = map.getHexAt(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
        let end = map.getHexAt(goal.x, goal.y);
        let path = finder.findPath(start.x, start.y, end.x, end.y, map.clone());
        let Newmsg = {
          type: 'path',
          data: path
        }
        notifyAGV(JSON.stringify(Newmsg), agvId);
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
    console.log("a new connection established");
  });
});

server.listen(8080, function(err){
  console.log(err, server.address())
});
