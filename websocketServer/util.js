import {log, listAGVClient, listDashboardClient, listBackendClient, map} from '../config.js';
import WebSocket from 'ws';
import { Hex, axialToXY } from '../class/hex.js';

function sendAGVPosition(agvId){
  let posHex = new Hex(listAGVClient[agvId].position.x, listAGVClient[agvId].position.y);
  log.debug([axialToXY(posHex)]);
  let msg = {
      type: 'position',
      data: axialToXY(posHex)
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

function notifyBackend(message){
  //broadcast to all Dashboard
  listBackendClient.forEach(function each(client) {
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

export {
  sendAGVPosition,
  notifyAGV,
  notifyDashboard,
  notifyBackend,
  sendMapToAll,
  sendMap
}