import {Hex, hexDirections, hexDistance} from './hex.js';

class map{
 //19 x 16
    constructor({width = 6, height = 8, listObs = []}){
        this.map = {};
        this.width = width;
        this.height = height;
        this.initMap();
        this.setObstacles(listObs);
        this.prev = [];
    }
    initMap(){
        for(let y = (-1*this.height) + 1; y <= 0; y++){
            let r_offset = Math.floor(y / 2.0);
            for(let x = -1 * r_offset; x < this.width - r_offset; x++){
                if(x == -0) x = 0;
                const hex = new Hex(x, y);
                this.map[hex.key()] = hex;
            }
        }
    }
    getHexAt(x, y){
        const hex = new Hex(x, y);
        return this.map[hex.key()];
    }
    clearMap(){
        Object.values(this.map).forEach(hex => hex.walkable = true);
    }
    addObstacle(x, y){
        const hex = this.getHexAt(x, y);
        if (hex == null) return;
        hex.walkable = false;
    }
    setObstacles(obstacles){
        obstacles.forEach(obstacle => {
            this.addObstacle(obstacle.x, obstacle.y);
        });
    }
    getObstacles(){
        return Object.values(this.map).filter(hex => !hex.walkable).map(hex => ({x: hex.x, y: hex.y}));
    }
    getNeigbors(hex){
        return hexDirections.map(direction => hex.neighbor(direction))
            .filter(neighbor => this.map[neighbor.key()]); 
    }
    getWalkableNeighbors(hex){
        //return from the grid from the hex
        return hexDirections.map(direction => hex.neighbor(direction))
            .filter(neighbor => this.map[neighbor.key()] && this.map[neighbor.key()]?.walkable)
            .map(neighbor => this.map[neighbor.key()].clone());
    }
    clone(){
        const newMap = new map({width: this.width, height: this.height, listObs: []});
        newMap.map = Object.assign({}, this.map);
        return newMap;
    }
    getReserveGrid(){
        return Object.values(this.map).filter(hex => hex.reserve).map(hex => ({x: hex.x, y: hex.y}));
    }
    setGridReserved(listPoint){
        for(let point of listPoint){
            const hex = this.getHexAt(point[0], point[1]);
            this.map[hex.key()].reserve = true;
        }
    }
    setGridUnreserved(listPoint){
        for(let point of listPoint){
            const hex = this.getHexAt(point[0], point[1]);
            this.map[hex.key()].reserve = false;
        }
    }
}

export default map;