import Heap from 'heap';
import { backtrace } from './Util.js';
import { hexDistance } from './hex.js';

class aStarFinder{
    constructor(opt){
        opt = opt || {};
        this.heuristic = hexDistance
        this.weight = opt.weight || 1; 
    }
    findPath(startX, startY, endX, endY, grid){
        let openList = new Heap((nodeA, nodeB) => nodeA.f - nodeB.f),
            startNode = grid.getHexAt(startX, startY),
            endNode = grid.getHexAt(endX, endY),
            heuristic = this.heuristic,
            weight = this.weight,
            node, neighbors, neighbor, x, y, ng;
        
        startNode.g = 0;
        startNode.f = 0;

        openList.push(startNode);
        startNode.opened = true;
        while(!openList.empty()){
            node = openList.pop();
            node.closed = true;
            if(node.equals(endNode)){
                return backtrace(node);
            }
            neighbors = grid.getWalkableNeighborsUnreserved(node);
            for(let i = 0, l = neighbors.length; i < l; ++i){
                neighbor = neighbors[i];
                if(neighbor.closed){
                    continue;
                }
                x = neighbor.x;
                y = neighbor.y;
                ng = node.g + 1;

                if(!neighbor.opened || ng < neighbor.g){
                    neighbor.g = ng;
                    neighbor.h = neighbor.h || weight * heuristic(Math.abs(x - endX), Math.abs(y - endY));
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = node;

                    if(!neighbor.opened){
                        openList.push(neighbor);
                        neighbor.opened = true;
                    }else{
                        openList.updateItem(neighbor);
                    }
                }
            }
        }
        return [];
    }

}

export default aStarFinder;