class AGV {
    constructor(id, position) {
        this.id = id;
        this.container = false;
        this.power = 100;
        this.orientation = 0;
        this.velocity = 0;

        this.position = position;
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
        this.power = data.power;
        this.orientation = data.orientation;
        this.velocity = data.velocity;
        this.position = data.position;
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
            power: this.power,
            orientation: this.orientation,
            position: this.position,
            velocity: this.velocity,
            paths: this.listPath
        }
    }
    isOnline(){
        return this.ws != null;
    }
}

export default AGV;
