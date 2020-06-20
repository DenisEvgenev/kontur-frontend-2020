let currentTurn, bestPort, basicVolumes, ports, level, homePort, closedPoints, openPoints;

export function startGame(levelMap, gameState) {
    currentTurn = 0;
    level = levelMap.split('\n');

    homePort = gameState.ports.find(port => port.isHome);
    homePort.f = 0;
    homePort.g = 0;

    basicVolumes = copyArrayOfObjects(gameState.goodsInPort);
    ports = copyArrayOfObjects(gameState.ports.filter(port => !port.isHome));
    ports.forEach(port => port.route = []);
    
    findPathAStar(ports, gameState.prices, gameState.goodsInPort);
}

export function getNextCommand(gameState) {
    currentTurn++;
    const { ship } = gameState;
    const prices = copyArrayOfObjects(gameState.prices);

    setBestGoodAndCostMoveInPorts(ports, gameState.goodsInPort, prices);
    setBestport(ship);

    const { bestGood } = bestPort;
    const downloadableVolume = getDownloadableVolume(ship, bestGood);

    if (isTooFarToPort(ship, bestPort)) return 'WAIT';

    if (isLoadGoods(ship, downloadableVolume)) return `LOAD ${bestGood.name} ${downloadableVolume}`;

    if (isSell(ship, bestPort)) {
        const { name, amount } = ship.goods[0];
        return `SELL ${name} ${amount}`;
    }

    if (isMove(ship, bestPort)) {
        reverseRoute(bestPort.route, ship, bestPort, homePort);
        const moveCommand = move(gameState.pirates, bestPort, ship);
        return moveCommand;
    }
}

function copyArrayOfObjects(array) {
    let copyArray = [];

    for (let i = 0; i < array.length; i++) {
        copyArray.push({...array[i]});
    }

    return copyArray;
}

function setBestGoodAndCostMoveInPorts(ports, goodsInPort, prices) {
    ports.forEach((port) => {
        const pricesOfPort = prices.find(price => price.portId === port.portId);
        port.bestGood = getBestGood(pricesOfPort, goodsInPort);
        port.costMove = pricesOfPort[port.bestGood.name] / (port.distance * 2 - 2);
    })
}

function setBestport(ship) {
    if (isHomePort(ship)) {
        bestPort = ports.reduce((prev, next) => next.costMove > prev.costMove ? next : prev);
    }
}

function isHomePort(ship) {
    return ship.y === homePort.y 
           && ship.x === homePort.x
           && ship.goods.length === 0;
}

function getDownloadableVolume(ship, bestGood) {
    let filledVolume = 0,
        freeVolume = 0;

    ship.goods.forEach(goodOnShip => {
        filledVolume += goodOnShip.amount * basicVolumes
        .find(item => item.name === goodOnShip.name).volume;
    });

    freeVolume = 368 - filledVolume;

    if (Math.trunc(freeVolume / bestGood.volume) > bestGood.amount) return bestGood.amount;
    return Math.trunc(freeVolume / bestGood.volume);
}

function isTooFarToPort(ship, bestPort) {
    return 180 - currentTurn < bestPort.distance
           && ship.goods.length === 0
           && ship.x === homePort.x 
           && ship.y === homePort.y;
}

function isLoadGoods(ship, downloadableVolume) {
    return downloadableVolume !== 0 
           && ship.y === homePort.y
           && ship.x === homePort.x;
}

function isSell(ship, bestPort) {
    return ship.goods.length !== 0 
           && ship.y === bestPort.y
           && ship.x === bestPort.x;
}

function isMove(ship, bestPort) {
    return ((ship.y !== bestPort.y || ship.x !== bestPort.x) && ship.goods.length !== 0) 
           || ((ship.y !== homePort.y || ship.x !== homePort.x) && ship.goods.length === 0);  
}

function reverseRoute(route, ship, bestPort, homePort) {
    if (ship.x === route[route.length - 1].x && ship.y === route[route.length - 1].y &&
        (bestPort.x === ship.x && bestPort.y === ship.y) ||
        (homePort.x === ship.x && homePort.y === ship.y)) {
        route.reverse();
    }
}

/**
 * Для поиска пути реализован алгоритм A*.
 * Каждому порту добавляется маршрут route (по точкам), и длина пути distance.
 *
 * @param {array} ports Массив портов
 */
function findPathAStar(ports) {
    ports.forEach((port) => {
        const map = getMap();
        openPoints = [homePort];
        closedPoints = [];

        calculateRoute(map, port);

        const firstPoint = closedPoints
            .find(point => port.x === point.x && port.y === point.y);
        shortRoute(firstPoint, port);
    });
}

function getMap() {
    let map = [];

    for (let y = 0; y < level.length; y++) {
        let rowMap = [];

        for (let x = 0; x < level[y].length; x++) {
            const distance = (level[y][x] === '#') ? -1 : 0;
            rowMap.push({ x, y, distance });
        }

        map.push(rowMap);
    };

    return map;
}

function calculateRoute(map, finishPoint) {
    if (openPoints.length === 0
        || closedPoints.find(point => point.x === finishPoint.x && point.y === finishPoint.y)) {
        return;
    }

    const currentPoint = openPoints.reduce((prev, curr) => prev.f < curr.f ? prev : curr);
    closedPoints.push(currentPoint);
    openPoints.splice(openPoints.indexOf(currentPoint), 1);

    let directionsPoints = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x:0, y: 1}]

    let directions = [];
    directionsPoints.forEach(dir => directions
        .push({
            x: currentPoint.x + dir.x,
            y: currentPoint.y + dir.y,
            g: currentPoint.g + 1,
            f: (currentPoint.g + 1) + 
                Math.abs((currentPoint.x + dir.x) - finishPoint.x) + 
                Math.abs(currentPoint.y + dir.y - finishPoint.y),
            parentPoint: currentPoint,
        })
    );

    directions = directions.filter(direction => 
        direction.x >= 0 
        && direction.y >= 0 
        && direction.x < map[0].length 
        && direction.y < map.length 
        && !closedPoints.find(point => point.x === direction.x && point.y === direction.y) 
        && !openPoints
            .find(point => point.x === direction.x && point.y === direction.y && point.g < direction.g) 
        && map[direction.y][direction.x].distance != '-1'
    );

    directions.forEach(direction => openPoints.forEach(point => {
        if (point.x === direction.x && point.y === direction.y && point.g > direction.g) {
            point.g = direction.g;
            point.f = direction.f;
            point.parentPoint = direction.parentPoint;
            directions.splice(directions.indexOf(direction, 1));
        }
    }))
    directions.forEach(point => openPoints.push(point));

    calculateRoute(map, finishPoint);
}

function shortRoute(closedPoints, port) {
    if (closedPoints === undefined) return;

    port.route.push({
        x: closedPoints.x,
        y: closedPoints.y,
    });
    port.distance = 1;

    if (closedPoints.parentPoint !== undefined) {
        shortRoute(closedPoints.parentPoint, port);
        port.distance++;
    }
}

function getBestGood(prices, goodsInPort) {
    let pricesPerMeter = getPricesPerMeter(prices, goodsInPort);
    let nameBestGood = getNameExpensiveGood(pricesPerMeter);

    return goodsInPort.filter(function (item) {
        return Object.keys(item).some(function (key) {
            return item[key] === nameBestGood;
        })
    })[0];
}

function getNameExpensiveGood(pricesPerMeter) {
    let maxCost = 0;
    for (let key in pricesPerMeter) {
        if (key != 'portId' && pricesPerMeter[key] >= maxCost) maxCost = pricesPerMeter[key];
    }

    for (let key in pricesPerMeter) {
        if (pricesPerMeter[key] === maxCost) return key;
    }
}

function getPricesPerMeter(prices, goodsInPort) {
    for (let key in prices) {
        if (key != 'portId' && !goodsInPort.find(good => good.name === key)) {
            prices[key] = 0;
        }
    }

    for (let i = 0; i < goodsInPort.length; i++) {
        if (!prices[goodsInPort[i].name]) continue;
        
        if (goodsInPort[i].volume > 368) prices[goodsInPort[i].name] = 0;        

        prices[goodsInPort[i].name] *= (
            goodsInPort[i].amount * goodsInPort[i].volume >= 368
            ? Math.trunc(368 / goodsInPort[i].volume)
            : goodsInPort[i].amount
        );
    }

    return prices;
}

function move(pirates, bestPort, ship) {
    const currentPoint = bestPort.route.find(point => point.x === ship.x && point.y === ship.y);
    const backPoint = bestPort.route[bestPort.route.indexOf(currentPoint) - 1];
    let nextPoint = bestPort.route[bestPort.route.indexOf(currentPoint) + 1];

    const commandOfNextPoint = getCommandOfPoint(nextPoint, pirates);

    switch (commandOfNextPoint) {
        case 'get back':
            nextPoint = getNextPoint(backPoint, ship);
            if (nextPoint.x === ship.x && nextPoint.y === ship.y) return 'WAIT';
            break;
        case 'lets wait':
            return 'WAIT';
        default:
            break;
    }
    
    if (nextPoint.x !== ship.x) return nextPoint.x > ship.x ? 'E' : 'W';
    if (nextPoint.y !== ship.y) return nextPoint.y > ship.y ? 'S' : 'N';
}

function getCommandOfPoint(nextPoint, pirates) {
    let result = 'go ahead';
        
    for (let i = 0; i < pirates.length; i++) {
        const rangeToPirate = Math.abs(pirates[i].y - nextPoint.y) + Math.abs(pirates[i].x - nextPoint.x);

        if (rangeToPirate >= 2 || result === 'get back') continue;
        
        if (pirates[i].x === nextPoint.x && pirates[i].y === nextPoint.y) {
            result = 'get back';
            continue;
        }       
        result = 'lets wait';
    }
    return result;
}

function getNextPoint(backPoint, ship) {
    let directionsPoints = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
    let directions = [];

    directionsPoints.forEach(direction => directions
        .push({
            x: ship.x + direction.x,
            y: ship.y + direction.y,
        }));
        
    directions = directions.filter(direction => level[direction.y][direction.x].distance != '#');    

    return directions[0] ? directions[0] : backPoint;
}
