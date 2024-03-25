import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

function onSocketError(err) {
  console.error(err);
}

const server = createServer();
const wss = new WebSocketServer({noServer: true });

let listAGVClient = {};
let listDashboardClient = [];
wss.on('connection', function connection(ws, request, client) {
  const userId = request.headers['id'];

  // Check if the client is AGV or Dashboard
  if(request.url === '/agv'){
    //add to list of AGV
    listAGVClient[userId] = ws;
    notifyDashboard(userId + ' online');
  }else if(request.url === '/dashboard'){
    listDashboardClient.push(ws);
  }

  ws.on('error', onSocketError);

  ws.on('message', function message(data) {
    if(request.url === '/agv'){
      console.log(data.toString());
    }else if(request.url === '/dashboard'){
      data = JSON.parse(data.toString());
      notifyAGV(data.cmd, data.id);
    }
  });

  ws.on("close", function close() {
    if(request.url === '/agv'){
      delete listAGVClient[userId];
      notifyDashboard(userId + ' offline');
      console.log('AGV ' + userId + ' disconnected')
    }else if(request.url === '/dashboard'){
      listDashboardClient = listDashboardClient.filter(function(client) {
        return client !== ws;
      });
      console.log('Dashboard disconnected')
    }
  });
});

function notifyAGV(message, agvId){
  //For targeted AGV id
  if(agvId != 0){
    let client = listAGVClient[agvId];
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
    return;
  }
  let listAGV = listAGVClient.keys();
  listAGV.forEach(function each(agvId) {
    let client = listAGVClient[agvId];
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function notifyDashboard(message){
  listDashboardClient.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/*
  pass: 1234
*/
server.on('upgrade', function upgrade(request, socket, head) {
  if(request.headers['websocketpass']?.toString() != '1234'){
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, function (ws) {
    wss.emit('connection', ws, request);
    console.log("connected")
  });
});

server.listen(8080, function(err){
  console.log(err, server.address())
});
