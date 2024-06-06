import AGV from './class/agv.js';
import Map from './class/map.js';
import aStarFinder from './class/aStarFinder.js';
import logging from './class/logging.js';

//fill with format [x,y] where the obstacle is located based on axial coordinate system
//look https://www.redblobgames.com/grids/hexagons/#coordinates
const listObs = [
    [5, -2],
    [4, -2],
    [3, -2],
    [2,-4],
    [3,-4],
    [4, -4],

    // [1,-2],
    // [2,0],
    // [0,0]
];

const log = new logging();
//List of AGV: ID, start Position in axial coordinate system
const listAGVClient = {
    '1': new AGV(1, {x: 0, y: 0}),
    '2': new AGV(2, {x: 0, y: 0}),
};
const listDashboardClient = [];
const map = new Map({width: 6, height: 8, listObs: listObs});
const finder = new aStarFinder();

export {
    log,
    listAGVClient,
    listDashboardClient,
    map,
    finder,
    listObs
}