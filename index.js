import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import AGV from './class/agv.js';

let listAGVClient = {
  '1': AGV(1),
  '2': AGV(2),
};
let listDashboardClient = [];

function onSocketError(err) {
  console.error(err);
}

function notifyAGV(message, agvId){
  //For targeted AGV id
  if(agvId != 0){
    let client = listAGVClient[agvId];
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
    return;
  }
  //broadcast to all AGV
  let listAGV = listAGVClient.keys();
  listAGV.forEach(function each(agvId) {
    let client = listAGVClient[agvId];
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
  }

  ws.on('error', onSocketError);

  ws.on('message', function message(data) {
    if(request.url === '/agv'){
      data = JSON.parse(data.toString());
      listAGVClient[userId].updateState(data);
      msg = {
        type: 'update',
        data: listAGVClient[userId].getState()
      }
      notifyDashboard(JSON.stringify(msg));
    }else if(request.url === '/dashboard'){
      data = JSON.parse(data.toString());
      //generatePath for AGV
      notifyAGV(data.cmd, data.id);
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
  comment server on upgrade if dont want to use password
  pass: 1234
*/
// server.on('upgrade', function upgrade(request, socket, head) {
//   if(request.headers['websocketpass']?.toString() != '1234'){
//     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
//     socket.destroy();
//     return;
//   }
//   wss.handleUpgrade(request, socket, head, function (ws) {
//     wss.emit('connection', ws, request);
//     console.log("connected")
//   });
// });

server.listen(8080, function(err){
  console.log(err, server.address())
});
