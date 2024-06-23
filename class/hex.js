const hexHeight = 350;
const hexSize = hexHeight/2;

class Hex{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.z = -x - y;
        this.walkable = true;
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
    clone(){
        let newHex = new Hex(this.x, this.y);
        newHex.walkable = this.walkable;
        newHex.reserve = this.reserve;
        return newHex;
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

function hexRound(fracHex){
    let q = Math.round(fracHex.x);
    let r = Math.round(fracHex.y);
    let s = Math.round(fracHex.z);
    let qDiff = Math.abs(q - fracHex.x);
    let rDiff = Math.abs(r - fracHex.y);
    let sDiff = Math.abs(s - fracHex.z);
    if(qDiff > rDiff && qDiff > sDiff){
        q = -r - s;
    } else if(rDiff > sDiff){
        r = -q - s;
    } else {
        s = -q - r;
    }
    return new Hex(q, r);
}

function handleMinusZero(val){
    if(val == 0){
        return 0;
    }
    return val
}

function axialToXY(hex){
    let x = hexSize * (Math.sqrt(3) * hex.x + Math.sqrt(3)/2.0 * hex.y);
    let y = hexSize * 3.0/2 * hex.y * -1;
    x = handleMinusZero(x)
    y = handleMinusZero(y)
    x = Math.round(x);
    y = Math.round(y);
    return {x, y}
}

function xyToAxial(x, y){
    let q = (x + Math.sqrt(3) * y / 3.0) / (hexSize * Math.sqrt(3)); 
    let r = -2.0 / 3 * y / hexSize;
    q = Math.round(q);
    r = Math.round(r);
    q = handleMinusZero(q)
    r = handleMinusZero(r)
    return hexRound(new Hex(q, r));
}

export { 
    Hex, 
    hexDirections, 
    hexDistance, 
    hexRound, 
    axialToXY, 
    xyToAxial
};