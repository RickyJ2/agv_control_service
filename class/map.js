import {Hex, hexDirections} from './hex.js';
import obs from '../listObstacles.js';
class map{
 //19 x 16
    constructor(){
        this.map = {};
        this.width = 5;
        this.height = 7;
        this.initMap();
        this.setObstacles(obs);
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
            this.addObstacle(obstacle[0], obstacle[1]);
        });
    }
    getObstacles(){
        return Object.values(this.map).filter(hex => !hex.walkable).map(hex => ({x: hex.x, y: hex.y}));
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
    localization(data){
        
    }
}

export default map;