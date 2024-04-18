import {Hex, hexDirections} from './hex.js';

class map{
 //19 x 16
    constructor(){
        this.map = {};
        this.width = 16
        this.height = 19;
        this.initMap();
    }
    initMap(){
        for(let y = - this.height; y <= 0; y++){
            let r_offset = Math.floor(y / 2.0);
            for(let x = -1 * r_offset; x <= this.width - r_offset; x++){
                const hex = new Hex(x, y);
                this.map[hex.key()] = hex;
            }
        }
    }
    getHexAt(x, y){
        const hex = new Hex(x, y);
        return this.map[hex.key()];
    }
    addObstacle(x, y){
        const hex = this.getHexAt(x, y);
        hex.walkable = false;
    }
    setObstacles(obstacles){
        obstacles.forEach(obstacle => {
            this.addObstacle(obstacle.x, obstacle.y);
        });
    }
    getWalkableNeighbors(hex){
        return hexDirections.map(direction => hex.neighbor(direction))
            .filter(neighbor => this.map[neighbor.key()] && this.map[neighbor.key()]?.walkable);
    }
    clone(){
        const newMap = new map();
        newMap.map = Object.assign({}, this.map);
        return newMap;
    }
}

export default map;