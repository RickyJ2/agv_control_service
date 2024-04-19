class AGV {
    constructor(id) {
        this.id = id;
        this.container = false;
        this.collision = false;
        this.power = 100;
        this.orientation = 0;
        this.acceleration = { x: 0, y: 0 };
        this.localMap = null;

        this.position = { x: 2, y: -1 };
        this.ws = null;

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
        this.position = { x, y };
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
            position: this.position
        }
    }
    isOnline(){
        return this.ws != null;
    }
}

export default AGV;
