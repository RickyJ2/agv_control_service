import {log, listAGVClient, listDashboardClient} from '../config.js';
import {notifyDashboard, sendMap} from '../websocketServer/util.js';

//When socket error occured
function onSocketError(err) {
    log.error([err]);
}
//When dashboard connected run only once
function onConnection(ws, _){
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
function onSocketClose(ws, _) {
    let index = listDashboardClient.indexOf(ws);
    if(index != -1){
        listDashboardClient.splice(index, 1);
    }
    log.info(['Dashboard disconnected']);
}
//Send map to dashboard
function sendingMap({ws}){
    sendMap(ws)
}

export {
    onSocketError,
    onConnection,
    onSocketClose,
    
    sendingMap
}