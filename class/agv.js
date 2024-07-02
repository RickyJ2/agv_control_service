import { Hex } from './hex.js';

class AGV {
    constructor(id, position) {
        this.id = id;
        this.container = false;
        this.power = 100;
        this.orientation = 0;
        this.velocity = 0;

        this.position = position;
        this.ws = null;

        this.listTaskCode = [];
        this.listGoalPoint = [];
        this.listPath = [];
    }
    addTask(taskCode, startPoint, goalPoint, pathStart, pathGoal){
        this.listTaskCode.push({"code": taskCode, "type": "NotifStart"});
        this.listTaskCode.push({"code": taskCode, "type": "NotifEnd"});
        this.listGoalPoint.push(startPoint);
        this.listGoalPoint.push(goalPoint);
        this.listPath.push(pathStart);
        this.listPath.push(pathGoal);
    }
    updateState(data){
        this.container = data.container;
        this.power = data.power;
        this.orientation = data.orientation;
        this.velocity = data.velocity;
        this.position = data.position;
    }
    setWs(ws) {
        this.ws = ws;
    }
    setPosition(x, y) {
        this.position = new Hex(x, y);
    }
    getState(){
        return {
            id: this.id,
            isOnline: this.isOnline(),
            container: this.container,
            power: this.power,
            orientation: this.orientation,
            position: this.position,
            velocity: this.velocity,
            paths: this.listPath
        }
    }
    getStateBackend(){
        return {
            id: this.id,
            isOnline: this.isOnline(),
            container: this.container,
            power: this.power,
            velocity: this.velocity,
            position: this.position,
            tasks: Math.floor(this.listTaskCode.length/2)
        }
    }
    isOnline(){
        return this.ws != null;
    }
}

export default AGV;
