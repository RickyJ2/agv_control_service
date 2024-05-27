class Hex{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.z = -x - y;
        this.walkable = true;
        this.reserve = false;
        this.parent = null;
    }
    key(){
        return `${this.x},${this.y}`;
    }
    equals(hex){
        return this.x == hex.x && this.y == hex.y;
    }
    notEquals(hex){
        return this.x != hex.x || this.y != hex.y;
    }
    add(hex){
        return new Hex(this.x + hex.x, this.y + hex.y);
    }
    subtract(hex){
        return new Hex(this.x - hex.x, this.y - hex.y);
    }
    multiply(k){
        return new Hex(this.x * k, this.y * k);
    }
    length(){
        return (Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)) / 2;
    }
    distance(hex){
        return this.subtract(hex).length();
    }
    neighbor(direction){
        return this.add(direction);
    }
    toString(){
        return `Hex(${this.x}, ${this.y})`;
    }
}

const hexDirections = [
    new Hex(1, 0), new Hex(1, -1), new Hex(0, -1),
    new Hex(-1, 0), new Hex(-1, 1), new Hex(0, 1)
];

function hexDistance(dx, dy){
    return (Math.abs(dx) + Math.abs(dy) + Math.abs(-dx-dy)) / 2;
}

export { Hex, hexDirections, hexDistance };