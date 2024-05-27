class AGV {
    constructor(id, position) {
        this.id = id;
        this.container = false;
        this.collision = false;
        this.power = 100;
        this.orientation = 0;
        this.acceleration = { x: 0, y: 0 };
        this.localMap = null;

        this.position = position;
        this.ws = 1;

        this.listGoalPoint = [];
        this.listPath = [];
    }
    addTask(goalPoint, path){
        this.listGoalPoint.push(goalPoint);
        this.listPath.push(path);
    }
    updateState(data){
        this.container = data.container;
        this.collision = data.collision;
        this.power = data.power;
        this.orientation = data.orientation;
        this.acceleration = data.acceleration;
        this.localMap = data.localMap;
    }
    setWs(ws) {
        this.ws = ws;
    }
    setPosition(x, y) {
        this.position = {x: x, y: y };
    }
    getState(){
        return {
            id: this.id,
            isOnline: this.isOnline(),
            container: this.container,
            collision: this.collision,
            power: this.power,
            orientation: this.orientation,
            acceleration: this.acceleration,
            position: this.position,
            paths: this.listPath
        }
    }
    isOnline(){
        return this.ws != null;
    }
}

export default AGV;
