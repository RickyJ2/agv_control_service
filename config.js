import AGV from './class/agv.js';
import Map from './class/map.js';
import aStarFinder from './class/aStarFinder.js';
import logging from './class/logging.js';

const PORT = 8080;
//fill with format {x: int, y: int} where the obstacle is located based on axial coordinate system
//look https://www.redblobgames.com/grids/hexagons/#coordinates
const listObs = [
    // {x: 5, y: -2},
    // {x: 4, y: -2},
    // {x: 3, y: -2},
    // {x: 2, y: -4},
    // {x: 3, y: -4},
    // {x: 4, y: -4},
];

const log = new logging();
//List of AGV: ID, start Position in axial coordinate system
const listAGVClient = {
    '1': new AGV(1, {x: 0, y: 0}),
    '2': new AGV(2, {x: 1, y: 0}),
};
const listDashboardClient = [];
const map = new Map({width: 6, height: 8, listObs: listObs});
const finder = new aStarFinder();

export {
    PORT,
    log,
    listAGVClient,
    listDashboardClient,
    map,
    finder,
    listObs
}