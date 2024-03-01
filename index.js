import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

function onSocketError(err) {
  console.error(err);
}

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

let listAGVClient = [];
let listDashboardClient = [];
/*
  Message Format
    [Code]-[AGVID]-[Data]
  List code:
  - 01 : LIDAR Data
  - 02 : Battery Status
  - 03 : AGV's speed and orientation
  - 11 : AGV's goal position
*/
wss.on('connection', function connection(ws, request, client) {
  const userId = request.headers['id'];

  // Check if the client is AGV or Dashboard
  if(request.url === '/agv'){
    listAGVClient.push(ws);
    // Notify dashboard that AGV is online
    listDashboardClient.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(userId + ' online');
      }
    });
  }else if(request.url === '/dashboard'){
    listDashboardClient.push(ws);
  }

  ws.on('error', onSocketError);

  ws.on('message', function message(data) {
    let [code, agvId, message] = data.split('-');
    switch(code){
      case '01':
        console.log(`LIDAR Data from AGV ${agvId}: ${message}`);
        break;
      case '02':
        console.log(`Battery Status from AGV ${agvId}: ${message}`);
        break;
      case '03':
        console.log(`Speed and Orientation from AGV ${agvId}: ${message}`);
        break;
      case '11':
        console.log(`Goal Position from AGV ${agvId}: ${message}`);
        break;
      default:
        console.log('Invalid message');
    }
  });

  ws.on("close", function close() {
    if(request.url === '/agv'){
      listAGVClient = listAGVClient.filter(function(client) {
        return client !== ws;
      });
      // Notify dashboard that AGV is offline
      listDashboardClient.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(userId + ' offline');
        }
      });
    }else if(request.url === '/dashboard'){
      listDashboardClient = listDashboardClient.filter(function(client) {
        return client !== ws;
      });
    }
  });
});

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

server.listen(8080);
