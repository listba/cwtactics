var INACTIVE_ID = -1;

var DESELECT_ID = -2;

var ACTIONS_BUFFER_SIZE = 200;

var MAX_PLAYER = 4;

var MAX_MAP_WIDTH = 100;

var MAX_MAP_HEIGHT = 100;

var MAX_UNITS_PER_PLAYER = 50;

var MAX_PROPERTIES = 300;

var MAX_SELECTION_RANGE = 15;

var MAX_BUFFER_SIZE = 200;

var VERSION = "0.3.5";

var DEBUG = true;

var MOD_PATH = "http://ctomni231.github.io/cwtactics/121213_dev_0_3_5/mod/cwt/";

var EV_FACTORY_TYPE_CHECK = "ev_fac_canBuild";

var EV_FACTORY_TYPE_BUILDED = "ev_fac_builded";

var GraphNodeType = {
    OPEN: 1,
    WALL: -1
};

function Graph(grid) {
    var nodes = [];
    for (var x = 0; x < grid.length; x++) {
        nodes[x] = [];
        for (var y = 0, row = grid[x]; y < row.length; y++) {
            nodes[x][y] = new GraphNode(x, y, row[y]);
        }
    }
    this.input = grid;
    this.nodes = nodes;
}

Graph.prototype.toString = function() {
    var graphString = "\n";
    var nodes = this.nodes;
    var rowDebug, row, y, l;
    for (var x = 0, len = nodes.length; x < len; x++) {
        rowDebug = "";
        row = nodes[x];
        for (y = 0, l = row.length; y < l; y++) {
            rowDebug += row[y].type + " ";
        }
        graphString = graphString + rowDebug + "\n";
    }
    return graphString;
};

function GraphNode(x, y, type) {
    this.data = {};
    this.x = x;
    this.y = y;
    this.pos = {
        x: x,
        y: y
    };
    this.type = type;
}

GraphNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + "]";
};

GraphNode.prototype.isWall = function() {
    return this.type == GraphNodeType.WALL;
};

function BinaryHeap(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        this.content.push(element);
        this.sinkDown(this.content.length - 1);
    },
    pop: function() {
        var result = this.content[0];
        var end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    },
    remove: function(node) {
        var i = this.content.indexOf(node);
        var end = this.content.pop();
        if (i !== this.content.length - 1) {
            this.content[i] = end;
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    },
    size: function() {
        return this.content.length;
    },
    rescoreElement: function(node) {
        this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function(n) {
        var element = this.content[n];
        while (n > 0) {
            var parentN = (n + 1 >> 1) - 1, parent = this.content[parentN];
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            } else {
                break;
            }
        }
    },
    bubbleUp: function(n) {
        var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
        while (true) {
            var child2N = n + 1 << 1, child1N = child2N - 1;
            var swap = null;
            if (child1N < length) {
                var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
                if (child1Score < elemScore) swap = child1N;
            }
            if (child2N < length) {
                var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            } else {
                break;
            }
        }
    }
};

var astar = {
    init: function(grid) {
        for (var x = 0, xl = grid.length; x < xl; x++) {
            for (var y = 0, yl = grid[x].length; y < yl; y++) {
                var node = grid[x][y];
                node.f = 0;
                node.g = 0;
                node.h = 0;
                node.cost = node.type;
                node.visited = false;
                node.closed = false;
                node.parent = null;
            }
        }
    },
    heap: function() {
        return new BinaryHeap(function(node) {
            return node.f;
        });
    },
    search: function(grid, start, end, diagonal, heuristic) {
        astar.init(grid);
        heuristic = heuristic || astar.manhattan;
        diagonal = !!diagonal;
        var openHeap = astar.heap();
        openHeap.push(start);
        while (openHeap.size() > 0) {
            var currentNode = openHeap.pop();
            if (currentNode === end) {
                var curr = currentNode;
                var ret = [];
                while (curr.parent) {
                    ret.push(curr);
                    curr = curr.parent;
                }
                return ret.reverse();
            }
            currentNode.closed = true;
            var neighbors = astar.neighbors(grid, currentNode, diagonal);
            for (var i = 0, il = neighbors.length; i < il; i++) {
                var neighbor = neighbors[i];
                if (neighbor.closed || neighbor.isWall()) {
                    continue;
                }
                var gScore = currentNode.g + neighbor.cost;
                var beenVisited = neighbor.visited;
                if (!beenVisited || gScore < neighbor.g) {
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor.pos, end.pos);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    if (!beenVisited) {
                        openHeap.push(neighbor);
                    } else {
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }
        return [];
    },
    manhattan: function(pos0, pos1) {
        var d1 = Math.abs(pos1.x - pos0.x);
        var d2 = Math.abs(pos1.y - pos0.y);
        return d1 + d2;
    },
    neighbors: function(grid, node, diagonals) {
        var ret = [];
        var x = node.x;
        var y = node.y;
        if (grid[x - 1] && grid[x - 1][y]) {
            ret.push(grid[x - 1][y]);
        }
        if (grid[x + 1] && grid[x + 1][y]) {
            ret.push(grid[x + 1][y]);
        }
        if (grid[x] && grid[x][y - 1]) {
            ret.push(grid[x][y - 1]);
        }
        if (grid[x] && grid[x][y + 1]) {
            ret.push(grid[x][y + 1]);
        }
        if (diagonals) {
            if (grid[x - 1] && grid[x - 1][y - 1]) {
                ret.push(grid[x - 1][y - 1]);
            }
            if (grid[x + 1] && grid[x + 1][y - 1]) {
                ret.push(grid[x + 1][y - 1]);
            }
            if (grid[x - 1] && grid[x - 1][y + 1]) {
                ret.push(grid[x - 1][y + 1]);
            }
            if (grid[x + 1] && grid[x + 1][y + 1]) {
                ret.push(grid[x + 1][y + 1]);
            }
        }
        return ret;
    }
};

(function() {
    var mapStrings = function(data, listener) {
        if (typeof data === "string") data = JSON.parse(data);
        for (var ri = 0, re = data.length; ri < re; ri++) {
            var rule = data[ri];
            if (typeof rule.$when !== "undefined") {
                var whenBlock = rule.$when;
                if (whenBlock.length % 2 !== 0) {
                    throw Error("rule.$when lenght must be odd");
                }
                for (var wi = 0, we = whenBlock.length; wi < we; wi += 2) {}
            }
        }
        return data;
    };
    var solve = function(ruleList, memory, attrName, value) {
        if (typeof value !== "number") value = 0;
        for (var i = 0, e = ruleList.length; i < e; i++) {
            var rule = ruleList[i];
            if (rule === null) continue;
            var attrVal = rule[attrName];
            if (typeof attrVal === "number") {
                var ruleSolvesTrue = true;
                var list = rule.$when;
                if (list) {
                    for (var li = 0, le = list.length; li < le; li += 2) {
                        var slot = memory[list[li]];
                        var check = list[li + 1];
                        var attrSolvesTrue = false;
                        if (check[0] === true) {
                            if (slot >= check[1] && slot <= check[2]) {
                                attrSolvesTrue = true;
                            }
                        } else {
                            for (var ci = 0, ce = check.length; ci < ce; ci++) {
                                if (slot === check[ci]) {
                                    attrSolvesTrue = true;
                                    break;
                                }
                            }
                        }
                        if (!attrSolvesTrue) {
                            ruleSolvesTrue = false;
                            break;
                        }
                    }
                }
                if (ruleSolvesTrue) {
                    if (rule.$set) value = 0;
                    value += attrVal;
                }
            }
        }
        return value;
    };
    if (typeof exports !== "undefined") {
        exports.mapStrings = mapStrings;
        exports.solve = solve;
    }
    if (typeof window !== "undefined") {
        if (!window.jsonScript) window.jsonScript = {};
        window.jsonScript.mapStrings = mapStrings;
        window.jsonScript.solve = solve;
    }
})();

var model = {};

var controller = {};

var util = {};

model.event_callbacks = {};

model.events = {};

model.event_define = function(ev) {
    assertStr(ev);
    assertUndef(model.event_callbacks[ev]);
    model.event_callbacks[ev] = [];
    model.events[ev] = function() {
        var list = model.event_callbacks[ev];
        for (var i = 0, e = list.length; i < e; i++) {
            list[i].apply(null, arguments);
        }
    };
};

model.event_on = function(ev, cb) {
    assertStr(ev);
    assertFn(cb);
    if (!model.event_callbacks[ev]) model.event_define(ev);
    model.event_callbacks[ev].push(cb);
};

var assert = function(expr, msgA) {
    if (!expr) {
        if (typeof msgA === "undefined") msgA = "FAIL";
        if (console.error) console.error(msgA);
        throw new Error(msgA);
    }
};

var assertFn = function(v) {
    assert(typeof v === "function");
};

var assertInt = function(v) {
    assert(typeof v === "number" && v % 1 === 0);
};

var assertIntRange = function(v, from, to) {
    assertInt(v);
    assert(v >= from && v <= to);
};

var assertBool = function(v) {
    assert(typeof v === "boolean");
};

var assertStr = function(v) {
    assert(typeof v === "string");
};

var assertList = function(v) {
    assert(Array.isArray(v));
};

var assertDef = function(v) {
    assert(typeof v !== "undefined");
};

var assertUndef = function(v) {
    assert(typeof v === "undefined");
};

var assertNull = function(v) {
    assert(v === null);
};

var assertNotNull = function(v) {
    assert(v !== null);
};

util.scoped = function(cb) {
    return cb();
};

util.wish = function() {
    return {
        declined: false,
        approve: function() {
            this.declined = false;
        },
        decline: function() {
            this.declined = true;
        }
    };
};

util.copy = function(from) {
    var to = {};
    var list = Object.keys(from);
    for (var i = 0, e = list.length; i < e; i++) {
        var key = list[i];
        to[key] = from[key];
    }
    return to;
};

util.isUndefined = function(value) {
    return typeof value === "undefined";
};

util.isString = function(value) {
    return typeof value === "string";
};

util.isBoolean = function(value) {
    return typeof value === "boolean";
};

util.isFunction = function(value) {
    return typeof value === "function";
};

util.isObject = function(value) {
    return typeof value === "object";
};

util.isInt = function(value) {
    return typeof value === "number" && value % 1 === 0;
};

util.intRange = function(value, from, to) {
    return typeof value === "number" && value % 1 === 0 && value >= from && value <= to;
};

(function() {
    var fill = function() {
        var defValue = this.__defValue__;
        var len = this.__length__;
        var isFN = typeof defValue === "function";
        for (var i = 0, e = len; i < e; i++) {
            if (isFN) this[i] = defValue(i, this[i]); else this[i] = defValue;
        }
    };
    var clone = function(list) {
        var lenA = this.__length__;
        var lenB = list.__length__;
        if (typeof lenB) lenB = list.length;
        if (lenB !== lenA) throw Error("source and target list have different lengths");
        for (var i = 0, e = lenA; i < e; i++) {
            list[i] = this[i];
        }
    };
    var grab = function(list) {
        var lenA = this.__length__;
        var lenB = list.__length__;
        if (typeof lenB) lenB = list.length;
        if (lenB !== lenA) throw Error("source and target list have different lengths");
        for (var i = 0, e = lenA; i < e; i++) {
            this[i] = list[i];
        }
    };
    util.list = function(len, defaultValue) {
        if (defaultValue === undefined) {
            defaultValue = null;
        }
        var warr = [];
        warr.__defValue__ = defaultValue;
        warr.__length__ = len;
        warr.resetValues = fill;
        warr.cloneValues = clone;
        warr.grabValues = grab;
        warr.resetValues();
        return warr;
    };
})();

util.error = function(errorId, errorData, stackData) {
    console.log("%cCW:T ERROR", "color:red;");
    console.log("%c .ERROR_ID:" + errorId, "color:red;");
    console.log("%c .DATA:" + errorData, "color:red;");
    console.log("%c .STACK:" + stackData, "color:red;");
};

util.log = function(msg) {
    if (arguments.length > 1) msg = Array.prototype.join.call(arguments, " ");
    console.log(msg);
};

(function() {
    var fill = function() {
        var defValue = this.__defValue__;
        var w = this.__width__;
        var h = this.__height__;
        var isFN = typeof defValue === "function";
        for (var i = 0, e = w; i < e; i++) {
            for (var j = 0, ej = h; j < ej; j++) {
                if (isFN) this[i][j] = defValue(i, j, this[i][j]); else this[i][j] = defValue;
            }
        }
    };
    var clone = function(matrix) {
        var w = this.__width__;
        var h = this.__height__;
        if (matrix.length !== this.length) throw Error();
        for (var i = 0, e = w; i < e; i++) {
            for (var j = 0, ej = h; j < ej; j++) {
                matrix[i][j] = this[i][j];
            }
        }
    };
    util.matrix = function(w, h, defaultValue) {
        if (defaultValue === undefined) {
            defaultValue = null;
        }
        var warr = [];
        warr.__defValue__ = defaultValue;
        warr.__width__ = w;
        warr.__height__ = h;
        warr.resetValues = fill;
        warr.cloneValues = clone;
        for (var i = 0; i < w; i++) {
            warr[i] = [];
        }
        warr.resetValues();
        return warr;
    };
})();

util.createRingBuffer = function(size) {
    var buffer = {
        push: function(msg) {
            if (this._data[this._wInd] !== null) {
                throw Error("message buffer is full");
            }
            this._data[this._wInd] = msg;
            this._wInd++;
            if (this._wInd === this._size) {
                this._wInd = 0;
            }
        },
        isEmpty: function() {
            return this._data[this._rInd] === null;
        },
        pop: function() {
            if (this._data[this._rInd] === null) {
                throw Error("message buffer is empty");
            }
            var msg = this._data[this._rInd];
            this._data[this._rInd] = null;
            this._rInd++;
            if (this._rInd === this._size) {
                this._rInd = 0;
            }
            return msg;
        },
        clear: function() {
            this._rInd = 0;
            this._wInd = 0;
            for (var i = 0; i < size; i++) {
                this._data[i] = null;
            }
        }
    };
    buffer._rInd = 0;
    buffer._wInd = 0;
    buffer._data = util.list(size, null);
    buffer._size = size;
    return buffer;
};

(function() {
    function setCenter(x, y, defValue) {
        var e = this.data.length;
        var cx = x;
        var cy = y;
        for (x = 0; x < e; x++) {
            for (y = 0; y < e; y++) {
                this.data[x][y] = defValue;
            }
        }
        this.centerX = Math.max(0, cx - (e - 1));
        this.centerY = Math.max(0, cy - (e - 1));
    }
    function getValueAt(x, y) {
        var data = this.data;
        var cy = this.centerX;
        var cx = this.centerY;
        var maxLen = data.length;
        x = x - cx;
        y = y - cy;
        if (x < 0 || y < 0 || x >= maxLen || y >= maxLen) return -1; else return data[x][y];
    }
    function setValueAt(x, y, value) {
        var data = this.data;
        var cy = this.centerX;
        var cx = this.centerY;
        var maxLen = data.length;
        x = x - cx;
        y = y - cy;
        if (x < 0 || y < 0 || x >= maxLen || y >= maxLen) {
            model.criticalError(error.ILLEGAL_PARAMETERS, error.SELECTION_DATA_OUT_OF_BOUNDS);
        } else data[x][y] = value;
    }
    function grab(otherSelection) {
        if (this.data.length !== otherSelection.data.length) throw Error("illegal grab selection");
        this.centerX = otherSelection.centerX;
        this.centerY = otherSelection.centerY;
        var e = this.data.length;
        for (x = 0; x < e; x++) {
            for (y = 0; y < e; y++) {
                this.data[x][y] = otherSelection.data[x][y];
            }
        }
    }
    function nextValidPosition(x, y, minValue, walkLeft, cb) {
        var data = this.data;
        var cy = this.centerX;
        var cx = this.centerY;
        var maxLen = data.length;
        x = x - cx;
        y = y - cy;
        if (x < 0 || y < 0 || x >= maxLen || y >= maxLen) {
            if (walkLeft) {
                x = maxLen - 1;
                y = maxLen - 1;
            } else {
                x = 0;
                y = 0;
            }
        }
        var mod = walkLeft ? -1 : +1;
        y += mod;
        for (;walkLeft ? x >= 0 : x < maxLen; x += mod) {
            for (;walkLeft ? y >= 0 : y < maxLen; y += mod) {
                if (data[x][y] >= minValue) {
                    cb(x, y);
                    return;
                }
            }
            y = walkLeft ? maxLen - 1 : 0;
        }
    }
    util.selectionMap = function(size) {
        var obj = {};
        obj.centerX = 0;
        obj.centerY = 0;
        obj.data = util.matrix(size, size, INACTIVE_ID);
        obj.nextValidPosition = nextValidPosition;
        obj.setValueAt = setValueAt;
        obj.getValueAt = getValueAt;
        obj.setCenter = setCenter;
        obj.grab = grab;
        return obj;
    };
})();

(function() {
    var BACK_TO_LAST_STATE = "$_LAST_STATE";
    var BREAK_TRANSITION = "$_BREAK_TRANSITION";
    var START_STATE = "NONE";
    function backToLastState() {
        return BACK_TO_LAST_STATE;
    }
    function breakTransition() {
        return BREAK_TRANSITION;
    }
    function clearHistory() {
        if (this.history !== null && this.history) this.history.splice(0);
    }
    function reset() {
        this.state = START_STATE;
        this.lastState = null;
        this.clearHistory();
    }
    function event(ev) {
        var stateEvent = this.structure[this.state][ev];
        if (stateEvent === undefined) {
            this.onerror(ev, this.state, "N/A", "NO EVENT");
            return;
        }
        var nextState = stateEvent.apply(this, arguments);
        if (!nextState) {
            this.onerror(ev, this.state, nextState, error.STM_INVALID_NEXT_STATE);
        }
        if (nextState === BREAK_TRANSITION && ev === "actionState") {
            this.onerror(ev, this.state, nextState, "BREAKS TRANSITION");
            return;
        }
        if (nextState === BREAK_TRANSITION) return;
        var goBack = nextState === this.backToLastState();
        if (goBack) {
            if (this.history === null) {
                this.onerror(ev, this.state, nextState, "NO HISTORY GIVEN");
            }
            if (this.history.length === 1) nextState = "IDLE"; else {
                this.history.pop();
                nextState = this.history[this.history.length - 1];
            }
        }
        var nextStateImpl = this.structure[nextState];
        var oldState = this.state;
        this.state = nextState;
        if (!nextStateImpl) {
            this.state = oldState;
            this.onerror(ev, this.state, nextState, "NO NEXT STATE");
            return;
        }
        if (nextStateImpl.onenter) {
            var breaker = nextStateImpl.onenter.apply(this, arguments);
            if (breaker === BREAK_TRANSITION) {
                this.state = oldState;
                return;
            }
        }
        if (this.history !== null && !goBack) this.history.push(this.state);
        if (nextStateImpl.actionState !== undefined) this.event.call(this, "actionState");
    }
    function error(event, fromState, toState, errCode) {
        util.log("state machine error (code:", errCode, "ev:", event, "from:", fromState, "to:", toState, ")");
    }
    function create(impl, config) {
        var machine = {};
        machine.structure = impl ? impl : {};
        machine.state = START_STATE;
        machine.lastState = null;
        machine.history = config && !config.noHistory ? null : [];
        machine.reset = reset;
        machine.event = event;
        machine.clearHistory = clearHistory;
        machine.backToLastState = backToLastState;
        machine.breakTransition = breakTransition;
        machine.onerror = config && config.onerror ? config.onerror : error;
        return machine;
    }
    util.stateMachine = create;
})();

controller.action_map = {};

controller.action_idmap = {};

controller.action_objects = {};

controller.action_buffer_ = util.createRingBuffer(ACTIONS_BUFFER_SIZE);

controller.action_define_ = function(impl) {
    if (!impl.hasOwnProperty("condition")) impl.condition = null;
    assert(impl.hasOwnProperty("key"));
    assert(impl.hasOwnProperty("invoke"));
    assert(!controller.action_objects.hasOwnProperty(impl.key));
    if (!impl.hasOwnProperty("prepareMenu")) impl.prepareMenu = null;
    if (!impl.hasOwnProperty("prepareTargets")) impl.prepareTargets = null;
    if (!impl.hasOwnProperty("prepareSelection")) impl.prepareSelection = null;
    if (!impl.hasOwnProperty("isTargetValid")) impl.isTargetValid = null;
    if (!impl.hasOwnProperty("multiStepAction")) impl.multiStepAction = false;
    if (impl.prepareTargets !== null && !impl.hasOwnProperty("targetSelectionType")) {
        impl.targetSelectionType = "A";
    }
    assert(impl.prepareTargets === null || impl.isTargetValid === null);
    controller.action_objects[impl.key] = impl;
};

controller.action_unitAction = function(impl) {
    impl.mapAction = false;
    impl.clientAction = false;
    impl.unitAction = true;
    impl.propertyAction = false;
    controller.action_define_(impl);
};

controller.action_propertyAction = function(impl) {
    impl.mapAction = false;
    impl.clientAction = false;
    impl.unitAction = false;
    impl.propertyAction = true;
    controller.action_define_(impl);
};

controller.action_mapAction = function(impl) {
    impl.mapAction = true;
    impl.clientAction = false;
    impl.unitAction = false;
    impl.propertyAction = false;
    controller.action_define_(impl);
};

controller.action_clientAction = function(impl) {
    impl.mapAction = false;
    impl.clientAction = true;
    impl.unitAction = false;
    impl.propertyAction = false;
    controller.action_define_(impl);
};

controller.action_checkInvokeArgs = function(key, args) {
    assert(typeof args !== "undefined" && typeof controller.action_idmap[key] !== "undefined" || typeof controller.action_map[key[key.length - 1]] !== "undefined");
};

controller.action_convertToInvokeDataArray = function(key, args) {
    controller.action_checkInvokeArgs(key, args);
    var result = [];
    for (var i = 0, e = args.length; i < e; i++) result[i] = args[i];
    result[result.length] = controller.action_idmap[key];
    return result;
};

controller.action_localInvoke = function(key, args) {
    controller.action_checkInvokeArgs(key, args);
    if (arguments.length === 2) key = controller.action_convertToInvokeDataArray(key, args);
    if (DEBUG) {
        util.log("adding", JSON.stringify(key), "to the command stack as", controller.action_map[key[key.length - 1]], "command");
    }
    controller.action_buffer_.push(key);
};

controller.action_sharedInvoke = function(key, args) {
    controller.action_checkInvokeArgs(key, args);
    if (arguments.length === 2) key = controller.action_convertToInvokeDataArray(key, args);
    if (controller.isNetworkGame()) {
        controller.sendNetworkMessage(JSON.stringify(key));
    }
    controller.action_localInvoke(key);
};

util.scoped(function() {
    var id = 0;
    controller.action_registerCommands = function(name) {
        controller.action_map[id.toString()] = name;
        controller.action_idmap[name] = id.toString();
        id++;
    };
});

controller.actionBuilder_buildFromUserData = function() {
    var scope = controller.stateMachine.data;
    var targetDto = scope.target;
    var sourceDto = scope.source;
    var moveDto = scope.movePath;
    var actionDto = scope.action;
    var actionObject = actionDto.object;
    var trapped = false;
    if (moveDto.data[0] !== -1) {
        assert(sourceDto.unitId !== INACTIVE_ID);
        var way = moveDto.data;
        var cx = sourceDto.x;
        var cy = sourceDto.y;
        for (var i = 0, e = way.length; i < e; i++) {
            if (way[i] === -1) break;
            switch (way[i]) {
              case model.move_MOVE_CODES.DOWN:
                cy++;
                break;

              case model.move_MOVE_CODES.UP:
                cy--;
                break;

              case model.move_MOVE_CODES.LEFT:
                cx--;
                break;

              case model.move_MOVE_CODES.RIGHT:
                cx++;
                break;
            }
            var unit = model.unit_posData[cx][cy];
            if (unit !== null) {
                if (model.player_data[model.round_turnOwner].team !== model.player_data[unit.owner].team) {
                    targetDto.set(cx, cy);
                    way.splice(i);
                    trapped = true;
                }
            }
        }
        controller.action_sharedInvoke("move_moveUnitByPath", [ moveDto.clone(), sourceDto.unitId, sourceDto.x, sourceDto.y, false ]);
    }
    if (!trapped) actionObject.invoke(scope); else controller.action_sharedInvoke("actions_trapWait", [ sourceDto.unitId ]);
    if (trapped || actionObject.unitAction && actionDto.selectedEntry !== "wait" && actionDto.selectedEntry !== "explode" && actionDto.selectedEntry !== "joinUnits") {
        controller.action_sharedInvoke("actions_markUnitNonActable", [ sourceDto.unitId ]);
    }
    return trapped;
};

controller.configBoundaries_ = {};

controller.defineGameConfig = function(name, min, max, def, step) {
    if (!name || controller.configBoundaries_.hasOwnProperty(name)) {
        model.criticalError(error.ILLEGAL_PARAMETERS, error.ILLEGAL_CONFIG_VAR_DEFINTION);
    }
    if (max < min || def < min || def > max) {
        model.criticalError(error.ILLEGAL_PARAMETERS, error.ILLEGAL_CONFIG_VAR_DEFINTION);
    }
    controller.configBoundaries_[name] = {
        min: min,
        max: max,
        defaultValue: def,
        step: typeof step === "number" ? step : 1
    };
};

controller.buildRoundConfig = function(cfg) {
    var boundaries = controller.configBoundaries_;
    var keys = Object.keys(boundaries);
    for (var i = 0, e = keys.length; i < e; i++) {
        var key = keys[i];
        var value;
        if (cfg && cfg.hasOwnProperty(key)) {
            value = cfg[key];
            if (value < boundaries[key].min) assert(false, key, "is greater than it's minimum value");
            if (value > boundaries[key].max) assert(false, key, "is greater than it's maximum value");
            if (boundaries[key].hasOwnProperty("step")) {
                if (value % boundaries[key].step !== 0) assert(false, key, "is does not fits one of it's possible values");
            }
        } else value = boundaries[key].defaultValue;
        model.cfg_configuration[key] = value;
    }
};

controller.configValue = function(attr) {
    return model.cfg_configuration[attr];
};

util.scoped(function() {
    function clientNeedsToImplementMe(name) {
        return function() {
            assert(false, "client has to implement interface " + name);
        };
    }
    controller.isNetworkGame = clientNeedsToImplementMe("controller.isNetworkGame");
    controller.isHost = clientNeedsToImplementMe("controller.isHost");
    controller.parseNetworkMessage = clientNeedsToImplementMe("controller.parseNetworkMessage");
    controller.sendNetworkMessage = clientNeedsToImplementMe("controller.sendNetworkMessage");
});

model.modification_load = function(data) {
    model.data_addEngineTypeSheets();
    model.data_weatherParser.parseAll(data.weathers);
    model.data_tileParser.parseAll(data.tiles);
    model.data_movetypeParser.parseAll(data.movetypes);
    model.data_unitParser.parseAll(data.units);
    model.data_fractionParser.parseAll(data.fraction);
    model.data_coParser.parseAll(data.co);
    model.data_gameModeParser.parseAll(data.gamemode);
    model.data_language = data.language;
    model.data_graphics = data.graphics;
    model.data_sounds = data.sounds;
    model.data_header = data.header;
    model.data_assets = data.assets;
    model.data_menu = data.menu;
    model.data_maps = data.maps;
    model.data_tips = data.tips;
};

model.event_define("prepare_game");

model.event_define("load_game");

model.event_define("save_game");

controller.persistence_saveModel = function() {
    var dom = {};
    model.events.save_game(dom);
    return JSON.stringify(dom);
};

controller.persistence_prepareModel = function(data) {
    model.events.prepare_game(data);
};

controller.persistence_loadModel = function(data) {
    model.events.load_game(data);
};

controller.roundConfig_CHANGE_TYPE = {
    CO_MAIN: 0,
    CO_SIDE: 1,
    CO_TYPE: 2,
    PLAYER_TYPE: 3,
    TEAM: 4
};

controller.roundConfig_coSelected = util.list(MAX_PLAYER, INACTIVE_ID);

controller.roundConfig_typeSelected = util.list(MAX_PLAYER, INACTIVE_ID);

controller.roundConfig_teamSelected = util.list(MAX_PLAYER, 0);

controller.roundConfig_prepare = function() {
    controller.roundConfig_coSelected.resetValues();
    controller.roundConfig_typeSelected.resetValues();
    controller.roundConfig_teamSelected.resetValues();
    for (var i = 0, e = MAX_PLAYER; i < e; i++) {
        if (model.player_data[i].team > INACTIVE_ID) {
            if (i === 0) {
                controller.roundConfig_typeSelected[i] = 0;
            } else controller.roundConfig_typeSelected[i] = 1;
            controller.roundConfig_teamSelected[i] = i;
        } else {
            controller.roundConfig_typeSelected[i] = DESELECT_ID;
        }
    }
};

controller.roundConfig_evalAfterwards = function() {
    var tmp;
    controller.ai_reset();
    model.client_deregisterPlayers();
    for (var i = 0, e = MAX_PLAYER; i < e; i++) {
        if (controller.roundConfig_typeSelected[i] >= 0) {
            model.player_data[i].gold = 0;
            model.player_data[i].team = controller.roundConfig_teamSelected[i];
            if (controller.roundConfig_typeSelected[i] === 1) {
                controller.ai_register(i);
            } else {
                model.client_registerPlayer(i);
            }
            tmp = controller.roundConfig_coSelected[i] !== INACTIVE_ID ? model.data_coTypes[controller.roundConfig_coSelected[i]] : null;
            model.co_setMainCo(i, tmp);
        } else {
            model.player_data[i].team = INACTIVE_ID;
            var firstUid = model.unit_firstUnitId(i);
            var lastUid = model.unit_lastUnitId(i);
            for (;firstUid <= lastUid; firstUid++) {
                var unit = model.unit_data[firstUid];
                if (unit) {
                    model.unit_posData[unit.x][unit.y] = null;
                    model.unit_data[firstUid].owner = INACTIVE_ID;
                }
            }
            for (var pi = 0, pe = model.property_data.length; pi < pe; pi++) {
                var prop = model.property_data[pi];
                if (prop && prop.owner === i) {
                    prop.owner = INACTIVE_ID;
                }
            }
        }
    }
};

controller.roundConfig_changeConfig = function(pid, type, prev) {
    assert(type >= controller.roundConfig_CHANGE_TYPE.CO_MAIN && type <= controller.roundConfig_CHANGE_TYPE.TEAM);
    switch (type) {
      case controller.roundConfig_CHANGE_TYPE.CO_MAIN:
        var cSelect = controller.roundConfig_coSelected[pid];
        if (prev) {
            cSelect--;
            if (cSelect < INACTIVE_ID) cSelect = model.data_coTypes.length - 1;
        } else {
            cSelect++;
            if (cSelect >= model.data_coTypes.length) cSelect = INACTIVE_ID;
        }
        controller.roundConfig_coSelected[pid] = cSelect;
        break;

      case controller.roundConfig_CHANGE_TYPE.CO_SIDE:
        assert(false, "not supported yet");
        break;

      case controller.roundConfig_CHANGE_TYPE.CO_TYPE:
        assert(false, "not supported yet");
        break;

      case controller.roundConfig_CHANGE_TYPE.PLAYER_TYPE:
        var cSelect = controller.roundConfig_typeSelected[pid];
        if (cSelect === DESELECT_ID) break;
        if (prev) {
            cSelect--;
            if (cSelect < INACTIVE_ID) cSelect = 1;
        } else {
            cSelect++;
            if (cSelect >= 2) cSelect = INACTIVE_ID;
        }
        controller.roundConfig_typeSelected[pid] = cSelect;
        break;

      case controller.roundConfig_CHANGE_TYPE.TEAM:
        var cSelect = controller.roundConfig_teamSelected[pid];
        while (true) {
            if (prev) {
                cSelect--;
                if (cSelect < 0) cSelect = 3;
            } else {
                cSelect++;
                if (cSelect >= 4) cSelect = 0;
            }
            var s = false;
            for (var i = 0, e = MAX_PLAYER; i < e; i++) {
                if (i === pid) continue;
                if (controller.roundConfig_typeSelected[i] >= 0 && controller.roundConfig_teamSelected[i] !== cSelect) {
                    s = true;
                }
            }
            if (s) break;
        }
        controller.roundConfig_teamSelected[pid] = cSelect;
        break;
    }
};

controller.scriptTags = {};

controller.script_memory_ = [];

controller.script_memoryMapper = function(rules) {};

controller.scriptBoundaries_ = {};

controller.defineGameScriptable = function(name, min, max) {
    if (!name || controller.scriptBoundaries_.hasOwnProperty(name) || max < min) {
        model.criticalError(error.ILLEGAL_PARAMETERS, error.ILLEGAL_CONFIG_VAR_DEFINTION);
    }
    controller.scriptBoundaries_[name] = [ min, max ];
};

controller.prepareTags = function(x, y, uid, fx, fy, fuid) {
    var tags = controller.scriptTags;
    if (tags.__oldUnit__) tags[tags.__oldUnit__] = false;
    if (tags.__oldTile__) tags[tags.__oldTile__] = false;
    tags.INDIRECT = false;
    tags.DIRECT = false;
    var unit = uid > -1 ? model.unit_data[uid] : model.unit_posData[x][y];
    if (unit) {
        tags.__oldUnit__ = unit.type.ID;
        tags[tags.__oldUnit__] = true;
        if (model.battle_isIndirectUnit(uid > -1 ? uid : model.unit_extractId(unit))) tags.INDIRECT = true; else tags.DIRECT = true;
    }
    var tileTp = model.map_data[x][y].ID;
    var prop = model.property_posMap[x][y];
    if (prop) {
        tileTp = prop.type.ID;
    }
    tags.__oldTile__ = tileTp;
    tags[tags.__oldTile__] = true;
    if (arguments.length > 3) {
        tags.OTHER_INDIRECT = false;
        tags.OTHER_DIRECT = false;
        unit = fuid > -1 ? model.unit_data[fuid] : model.unit_posData[fx][fy];
        if (unit) {
            if (model.battle_isIndirectUnit(fuid > -1 ? fuid : model.unit_extractId(unit))) tags.OTHER_INDIRECT = true; else tags.OTHER_DIRECT = true;
        }
    }
};

controller.scriptedValueByRules = function(rules, pid, attr, value) {};

controller.scriptedValue = function(pid, attr, value) {
    assert(util.isInt(value));
    var tags = controller.scriptTags;
    value = jsonScript.solve(model.rule_global, tags, attr, value);
    value = jsonScript.solve(model.rule_map, tags, attr, value);
    var co = model.co_data[pid].coA;
    var weather = true;
    if (co) {
        value = jsonScript.solve(co.d2d, tags, attr, value);
        weather = jsonScript.solve(co.d2d, tags, "neutralizeWeather", 0) === 0;
        if (model.co_data[pid].level >= model.co_POWER_LEVEL.COP) {
            if (model.co_data[pid].level === model.co_POWER_LEVEL.COP) {
                value = jsonScript.solve(co.cop.turn, tags, attr, value);
            } else if (model.co_data[pid].level === model.co_POWER_LEVEL.SCOP) {
                value = jsonScript.solve(co.scop.turn, tags, attr, value);
            }
        }
    }
    var wth = model.weather_data;
    if (weather && wth) value = jsonScript.solve(wth.rules, tags, attr, value);
    var bounds = controller.scriptBoundaries_[attr];
    if (value < bounds[0]) value = bounds[0]; else if (value > bounds[1]) value = bounds[1];
    return value;
};

controller.TaggedPosition = {
    clean: function() {
        this.x = -1;
        this.y = -1;
        this.unit = null;
        this.unitId = -1;
        this.property = null;
        this.propertyId = -1;
    },
    grab: function(otherPos) {
        this.x = otherPos.x;
        this.y = otherPos.y;
        this.unit = otherPos.unit;
        this.unitId = otherPos.unitId;
        this.property = otherPos.property;
        this.propertyId = otherPos.propertyId;
    },
    set: function(x, y) {
        this.x = x;
        this.y = y;
        var refObj;
        var isValid = x !== -1 && y !== -1;
        var inFog = isValid ? model.fog_turnOwnerData[x][y] === 0 : false;
        refObj = isValid ? model.unit_getByPos(x, y) : null;
        if (isValid && !inFog && refObj !== null && (!refObj.hidden || refObj.owner === model.round_turnOwner || model.player_data[refObj.owner].team === model.player_data[model.round_turnOwner].team)) {
            this.unit = refObj;
            this.unitId = model.unit_extractId(refObj);
        } else {
            this.unit = null;
            this.unitId = -1;
        }
        refObj = isValid ? model.property_getByPos(x, y) : null;
        if (isValid && refObj !== null) {
            this.property = refObj;
            this.propertyId = model.property_extractId(refObj);
        } else {
            this.property = null;
            this.propertyId = -1;
        }
    }
};

controller.stateMachine = util.stateMachine({
    NONE: {
        start: function() {
            if (DEBUG) util.log("Initializing game state machine");
            return "IDLE";
        }
    },
    IDLE: {
        onenter: function() {
            this.data.menu.clean();
            this.data.movePath.clean();
            this.data.action.selectedEntry = null;
            this.data.action.selectedSubEntry = null;
            this.data.action.object = null;
            this.clearHistory();
            this.data.inMultiStep = false;
            this.data.makeMultistep = true;
            this.data.source.clean();
            this.data.target.clean();
            this.data.targetselection.clean();
        },
        action: function(ev, x, y) {
            this.data.source.set(x, y);
            if (this.data.source.unitId !== INACTIVE_ID && this.data.source.unit.owner === model.round_turnOwner && model.actions_canAct(this.data.source.unitId)) {
                this.data.target.set(x, y);
                this.data.movePath.clean();
                this.data.movePath.move_fillMoveMap();
                if (this.data.selection.getValueAt(x - 1, y) < 0 && this.data.selection.getValueAt(x + 1, y) < 0 && this.data.selection.getValueAt(x, y - 1) < 0 && this.data.selection.getValueAt(x, y + 1) < 0) {
                    this.data.target.set(x, y);
                    return "ACTION_MENU";
                } else return "MOVEPATH_SELECTION";
            } else {
                this.data.target.set(x, y);
                return "ACTION_MENU";
            }
        },
        cancel: function(ev, x, y) {
            return this.breakTransition();
        }
    },
    MOVEPATH_SELECTION: {
        onenter: function(ev, x, y) {},
        action: function(ev, x, y) {
            if (this.data.selection.getValueAt(x, y) < 0) {
                if (DEBUG) util.log("break event because selection is not in the selection map");
                return this.breakTransition();
            }
            var ox = this.data.target.x;
            var oy = this.data.target.y;
            var dis = model.map_getDistance(ox, oy, x, y);
            this.data.target.set(x, y);
            if (dis === 0) {
                return "ACTION_MENU";
            } else if (dis === 1) {
                var code = model.move_codeFromAtoB(ox, oy, x, y);
                controller.stateMachine.data.movePath.addCodeToPath(x, y, code);
                return this.breakTransition();
            } else {
                controller.stateMachine.data.movePath.setPathByRecalculation(x, y);
                return this.breakTransition();
            }
        },
        cancel: function() {
            this.data.target.clean();
            return this.backToLastState();
        }
    },
    ACTION_MENU: {
        onenter: function() {
            this.data.menu.clean();
            this.data.menu.generate();
            if (this.data.menu.size === 0) {
                return this.breakTransition();
            }
        },
        action: function(ev, index) {
            var action = this.data.menu.data[index];
            var actObj = controller.action_objects[action];
            this.data.action.selectedEntry = action;
            this.data.action.object = actObj;
            if (actObj.prepareMenu !== null) return "ACTION_SUBMENU"; else if (actObj.isTargetValid !== null) return "ACTION_SELECT_TILE"; else if (actObj.prepareTargets !== null && actObj.targetSelectionType === "A") return this.data.selection.prepare(); else return "FLUSH_ACTION";
        },
        cancel: function() {
            this.data.target.grab(this.data.source);
            return this.backToLastState();
        }
    },
    ACTION_SUBMENU: {
        onenter: function() {
            if (!this.data.inMultiStep) {
                this.data.menu.clean();
                this.data.action.object.prepareMenu(this.data);
                if (this.data.menu.size === 0) {
                    assert(false, "sub menu cannot be empty");
                }
            }
        },
        action: function(ev, index) {
            if (!this.data.menu.enabled[index]) {
                return this.breakTransition();
            }
            var action = this.data.menu.data[index];
            if (action === "done") {
                return "IDLE";
            }
            this.data.action.selectedSubEntry = action;
            if (this.data.action.object.prepareTargets !== null && this.data.action.object.targetSelectionType === "B") {
                return this.data.selection.prepare();
            } else return "FLUSH_ACTION";
        },
        cancel: function() {
            if (this.data.inMultiStep) return this.backToLastState();
            this.data.menu.clean();
            this.data.menu.generate();
            return this.backToLastState();
        }
    },
    ACTION_SELECT_TARGET_A: {
        onenter: function() {
            this.data.targetselection.clean();
        },
        action: function(ev, x, y) {
            if (this.data.selection.getValueAt(x, y) < 0) {
                if (DEBUG) util.log("break event because selection is not in the map");
                return this.breakTransition();
            }
            this.data.targetselection.set(x, y);
            return "FLUSH_ACTION";
        },
        cancel: function() {
            return this.backToLastState();
        }
    },
    ACTION_SELECT_TARGET_B: {
        onenter: function() {
            this.data.targetselection.clean();
        },
        action: function(ev, x, y) {
            if (this.data.selection.getValueAt(x, y) < 0) {
                if (DEBUG) util.log("break event because selection is not in the map");
                return this.breakTransition();
            }
            this.data.targetselection.set(x, y);
            return "FLUSH_ACTION";
        },
        cancel: function() {
            return this.backToLastState();
        }
    },
    ACTION_SELECT_TILE: {
        onenter: function() {
            this.data.targetselection.clean();
            var prepareSelection = this.data.action.object.prepareSelection;
            if (prepareSelection) prepareSelection(this.data); else this.data.selectionRange = 1;
        },
        action: function(ev, x, y) {
            if (this.data.action.object.isTargetValid(this.data, x, y)) {
                this.data.targetselection.set(x, y);
                return "FLUSH_ACTION";
            } else return this.breakTransition();
        },
        cancel: function() {
            this.data.targetselection.clean();
            return this.backToLastState();
        }
    },
    FLUSH_ACTION: {
        actionState: function() {
            var trapped = controller.actionBuilder_buildFromUserData();
            if (!trapped && this.data.action.object.multiStepAction) {
                controller.action_localInvoke("multistep_nextStep_", []);
                return "MULTISTEP_IDLE";
            } else return "IDLE";
        }
    },
    MULTISTEP_IDLE: {
        nextStep: function() {
            var actObj = this.data.action.object;
            this.data.movePath.clean();
            this.data.menu.clean();
            actObj.prepareMenu(this.data);
            this.data.menu.addEntry("done");
            this.data.inMultiStep = true;
            return this.data.menu.size > 1 ? "ACTION_SUBMENU" : "IDLE";
        }
    }
});

controller.stateMachine.data = {
    source: Object.create(controller.TaggedPosition),
    target: Object.create(controller.TaggedPosition),
    targetselection: Object.create(controller.TaggedPosition),
    thereIsUnitRelationShip: function(posA, posB) {
        if (posA.unit && posA.unit === posB.unit) return model.player_RELATION_MODES.SAME_OBJECT;
        return model.player_getRelationship(posA.unit !== null ? posA.unit.owner : -1, posB.unit !== null ? posB.unit.owner : -1);
    },
    thereIsUnitToPropertyRelationShip: function(posA, posB) {
        return model.player_getRelationship(posA.unit !== null ? posA.unit.owner : -1, posB.property !== null ? posB.property.owner : null);
    },
    action: {
        selectedEntry: null,
        selectedSubEntry: null,
        object: null
    },
    movePath: {
        data: util.scoped(function() {
            var list = util.list(MAX_SELECTION_RANGE, INACTIVE_ID);
            list.getLastCode = function() {
                for (var i = this.length - 1; i > 0; i--) if (this[i] !== INACTIVE_ID) return this[i];
                return INACTIVE_ID;
            };
            list.getSize = function() {
                for (var i = this.length - 1; i > 0; i--) if (this[i] !== INACTIVE_ID) return i + 1;
                return 0;
            };
            return list;
        }),
        clean: function() {
            this.data.resetValues();
        },
        clone: function() {
            var path = [];
            for (var i = 0, e = this.data.length; i < e; i++) {
                if (this.data[i] === -1) break;
                path[i] = this.data[i];
            }
            return path;
        },
        addCodeToPath: function(tx, ty, code) {
            var wasAdded = model.move_addCodeToPath(code, this.data);
            if (!wasAdded) this.setPathByRecalculation(tx, ty);
        },
        setPathByRecalculation: function(tx, ty) {
            var data = controller.stateMachine.data;
            var source = data.source;
            var selection = data.selection;
            var movePath = data.movePath.data;
            this.data.resetValues();
            model.move_generatePath(source.x, source.y, tx, ty, selection, movePath);
        },
        move_fillMoveMap: function(x, y, unit) {
            var data = controller.stateMachine.data;
            model.move_fillMoveMap(data.source, data.selection, x, y, unit);
        }
    },
    menu: {
        data: util.list(20, null),
        enabled: util.list(20, true),
        size: 0,
        addEntry: function(entry, enabled, extraData) {
            assert(this.size < this.data.length);
            this.data[this.size] = entry;
            if (typeof enabled === "undefined") enabled = true;
            this.enabled[this.size] = enabled === true;
            this.size++;
        },
        clean: function() {
            this.size = 0;
        },
        wish: util.wish(),
        generate: util.scoped(function() {
            var commandKeys;
            return function() {
                if (!commandKeys) commandKeys = Object.keys(controller.action_objects);
                var checkMode;
                var result;
                var data = controller.stateMachine.data;
                var mapActable = false;
                var propertyActable = true;
                var property = data.source.property;
                var unitActable = true;
                var selectedUnit = data.source.unit;
                var st_mode = data.thereIsUnitRelationShip(data.source, data.target);
                var sst_mode = data.thereIsUnitRelationShip(data.source, data.targetselection);
                var pr_st_mode = data.thereIsUnitToPropertyRelationShip(data.source, data.target);
                var pr_sst_mode = data.thereIsUnitToPropertyRelationShip(data.source, data.targetselection);
                if (selectedUnit === null || selectedUnit.owner !== model.round_turnOwner) unitActable = false; else if (!model.actions_canAct(data.source.unitId)) unitActable = false;
                if (selectedUnit !== null) propertyActable = false;
                if (property === null || property.owner !== model.round_turnOwner || property.type.blocker) propertyActable = false;
                if (!unitActable && !propertyActable) mapActable = true;
                for (var i = 0, e = commandKeys.length; i < e; i++) {
                    var action = controller.action_objects[commandKeys[i]];
                    if (!action.clientAction && (!model.client_isLocalPid(model.round_turnOwner) || !controller.ai_isHuman(model.round_turnOwner))) continue;
                    if (action.unitAction) {
                        if (!unitActable) continue;
                        if (action.relation) {
                            checkMode = null;
                            if (action.relation[0] === "S" && action.relation[1] === "T") checkMode = st_mode; else if (action.relation[0] === "S" && action.relation[1] === "ST") checkMode = sst_mode;
                            result = false;
                            for (var si = 2, se = action.relation.length; si < se; si++) {
                                if (action.relation[si] === checkMode) result = true;
                            }
                            if (!result) continue;
                        }
                        if (action.relationToProp) {
                            checkMode = null;
                            if (action.relation[0] === "S" && action.relationToProp[1] === "T") checkMode = pr_st_mode; else if (action.relation[0] === "S" && action.relationToProp[1] === "ST") checkMode = pr_sst_mode;
                            result = false;
                            for (var si = 2, se = action.relationToProp.length; si < se; si++) {
                                if (action.relationToProp[si] === checkMode) result = true;
                            }
                            if (!result) continue;
                        }
                    } else if (action.propertyAction && !propertyActable) continue; else if (action.mapAction === true && !mapActable) continue; else if (action.clientAction === true && !mapActable) continue;
                    data.menu.wish.approve();
                    if (!(action.condition && !action.condition(data, data.menu.wish))) {
                        data.menu.addEntry(commandKeys[i]);
                    }
                }
            };
        })
    },
    selection: util.scoped(function() {
        var sMap = util.selectionMap(MAX_SELECTION_RANGE * 4 + 1);
        sMap.prepare = function() {
            var target = controller.stateMachine.data.target;
            var x = target.x;
            var y = target.y;
            this.setCenter(x, y, -1);
            var actObj = controller.stateMachine.data.action.object;
            actObj.prepareTargets(controller.stateMachine.data);
            return actObj.targetSelectionType === "A" ? "ACTION_SELECT_TARGET_A" : "ACTION_SELECT_TARGET_B";
        };
        sMap.rerenderNonInactive = function() {
            var e = this.data.length;
            var cx = this.centerX;
            var cy = this.centerY;
            for (x = 0; x < e; x++) {
                for (y = 0; y < e; y++) {
                    if (this.data[x + cx][y + cy] > INACTIVE_ID) view.redraw_markPos(x + cx, y + cy);
                }
            }
        };
        return sMap;
    }),
    selectionRange: -1,
    inMultiStep: false
};

controller.ai_spec = "DumbBoy [0.25]";

controller.ai_SCORE = {
    LOW: 100,
    NORMAL: 200,
    HIGH: 300,
    CRITICAL: 999
};

controller.ai_CHECKS = [];

controller.ai_data = util.list(MAX_PLAYER - 1, function() {
    return {
        pid: INACTIVE_ID
    };
});

controller.ai_loopHolder_ = {
    i: -1,
    e: -1,
    prop: -1,
    score: -1
};

controller.ai_scoreDataHolder_ = {
    source: Object.create(controller.TaggedPosition),
    target: Object.create(controller.TaggedPosition),
    selectionTarget: Object.create(controller.TaggedPosition),
    selection: util.selectionMap(MAX_SELECTION_RANGE * 4 + 1),
    action: {
        selectedSubEntry: ""
    },
    cacheInt: 0
};

controller.ai_actionDataHolder_ = {
    source: Object.create(controller.TaggedPosition),
    target: Object.create(controller.TaggedPosition),
    selectionTarget: Object.create(controller.TaggedPosition),
    selection: util.selectionMap(MAX_SELECTION_RANGE * 4 + 1),
    used: false,
    check_index: -1,
    endsAiTurn: false,
    action: {
        selectedSubEntry: ""
    },
    cacheInt: 0
};

controller.ai_reset = function() {
    for (var i = 0, e = MAX_PLAYER - 1; i < e; i++) {
        controller.ai_data[i].pid = INACTIVE_ID;
    }
};

controller.ai_active = null;

controller.ai_defineRoutine = function(impl) {
    assert(util.isString(impl.key));
    assert(!controller.ai_CHECKS.hasOwnProperty(impl.key));
    assert(util.isFunction(impl.scoring));
    assert(util.isFunction(impl.prepare));
    controller.ai_CHECKS.push(impl);
};

controller.ai_getRoutine = function(key) {
    assert(util.isString(key));
    var i = 0;
    var e = controller.ai_CHECKS.length;
    while (i < e) {
        if (controller.ai_CHECKS[i].key === key) return controller.ai_CHECKS[i];
        i++;
    }
    return null;
};

controller.ai_register = function(pid) {
    assert(model.player_isValidPid(pid));
    for (var i = 0; i < controller.ai_data.length; i++) {
        if (controller.ai_data[i].pid === INACTIVE_ID) {
            controller.ai_data[i].pid = pid;
            return;
        }
    }
};

controller.ai_deregister = function(pid) {
    for (var i = 0; i < controller.ai_data.length; i++) {
        if (controller.ai_data[i].pid === pid) {
            controller.ai_data[i].pid = INACTIVE_ID;
            return;
        }
    }
    assert(false, "player isn't ai controlled");
};

controller.ai_isHuman = function(pid) {
    for (var i = controller.ai_data.length - 1; i >= 0; i--) {
        if (controller.ai_data[i].pid === pid) return false;
    }
    return true;
};

controller.ai_machine = util.stateMachine({
    IDLE: {
        tick: function() {
            util.log(controller.ai_spec, "- doing step in idle state");
            assert(!controller.ai_active);
            for (var i = controller.ai_data.length - 1; i >= 0; i--) {
                if (controller.ai_data[i].pid === model.round_turnOwner) {
                    controller.ai_active = controller.ai_data[i];
                }
            }
            assert(controller.ai_active);
            return "SET_UP_AI_TURN";
        }
    },
    SET_UP_AI_TURN: {
        tick: function() {
            util.log(controller.ai_spec, "- setup turn");
            return "PHASE_PREPARE_SEARCH_TASKS";
        }
    },
    PHASE_PREPARE_SEARCH_TASKS: {
        tick: function() {
            util.log(controller.ai_spec, "- prepare search unit tasks");
            var data = controller.ai_loopHolder_;
            data.i = model.unit_firstUnitId(model.round_turnOwner);
            data.e = model.unit_lastUnitId(model.round_turnOwner) + MAX_PROPERTIES + 1;
            data.prop = data.i + MAX_UNITS_PER_PLAYER;
            data.score = -1;
            return "PHASE_SEARCH_TASK";
        }
    },
    PHASE_SEARCH_TASK: {
        tick: function() {
            util.log(controller.ai_spec, "- search task");
            var loopData = controller.ai_loopHolder_;
            var scoreData = controller.ai_scoreDataHolder_;
            var actionData = controller.ai_actionDataHolder_;
            while (true) {
                scoreData.source.set(-1, -1);
                scoreData.target.set(-1, -1);
                scoreData.selectionTarget.set(-1, -1);
                scoreData.selection.setCenter(0, 0, -1);
                scoreData.used = false;
                scoreData.selectedSubEntry = "";
                scoreData.cacheInt = -1;
                var dataTp = -1;
                if (loopData.i < loopData.e) {
                    if (loopData.i < loopData.prop) {
                        util.log(controller.ai_spec, "- ..for unit", loopData.i);
                        var unit = model.unit_data[loopData.i];
                        if (unit.owner !== INACTIVE_ID && unit.loadedIn === INACTIVE_ID) {
                            dataTp = 0;
                            scoreData.source.set(unit.x, unit.y);
                            model.move_fillMoveMap(scoreData.source, scoreData.selection);
                        }
                    } else {
                        util.log(controller.ai_spec, "- ..for property", loopData.i);
                        var prop = model.property_data[loopData.i - loopData.prop];
                        if (prop.owner === controller.ai_active.pid) {
                            dataTp = 1;
                            scoreData.source.set(prop.x, prop.y);
                        }
                    }
                } else {
                    util.log(controller.ai_spec, "- ..for map");
                    dataTp = 2;
                }
                var cScore = -1;
                var nScore = -1;
                var i = 0;
                var e = controller.ai_CHECKS.length;
                if (dataTp !== -1) {
                    while (i < e) {
                        var check = controller.ai_CHECKS[i];
                        i++;
                        if (dataTp !== 0 && check.unitAction) continue;
                        if (dataTp !== 1 && check.propAction) continue;
                        if (dataTp !== 2 && check.mapAction) continue;
                        nScore = check.scoring(scoreData);
                        if (nScore > loopData.score) {
                            actionData.source.grab(scoreData.source);
                            actionData.target.grab(scoreData.target);
                            actionData.selectionTarget.grab(scoreData.selectionTarget);
                            actionData.selection.grab(scoreData.selection);
                            actionData.used = true;
                            actionData.check_index = i - 1;
                            actionData.endsAiTurn = check.endsAiTurn === true;
                            actionData.cacheInt = scoreData.cacheInt;
                            loopData.score = nScore;
                            actionData.action.selectedSubEntry = scoreData.action.selectedSubEntry;
                        }
                    }
                }
                loopData.i++;
                if (dataTp !== -1 && nScore !== -1 || loopData.i > loopData.e) break;
            }
            return loopData.i <= loopData.e ? "PHASE_SEARCH_TASK" : "PHASE_FLUSH_TASK";
        }
    },
    PHASE_FLUSH_TASK: {
        tick: function() {
            util.log(controller.ai_spec, "- flush most important command");
            var actionData = controller.ai_actionDataHolder_;
            if (actionData.used) {
                var action = controller.ai_CHECKS[actionData.check_index];
                if (DEBUG) util.log("invoke action", action.key);
                action.prepare(actionData);
                return actionData.endsAiTurn === true ? "TEAR_DOWN_AI_TURN" : "PHASE_PREPARE_SEARCH_TASKS";
            }
            throw Error("at least one action must explicit ending AI turn");
        }
    },
    TEAR_DOWN_AI_TURN: {
        tick: function() {
            util.log(controller.ai_spec, "- tear down turn");
            controller.ai_active = null;
            controller.action_objects.nextTurn.invoke();
            return "IDLE";
        }
    }
});

controller.ai_machine.state = "IDLE";

controller.update_inGameRound = false;

if (DEBUG) controller.update_evaledChars_ = 0;

controller.update_tickFrame = function(delta) {
    assert(controller.update_inGameRound);
    model.timer_updateTimer(delta);
    if (!controller.update_inGameRound) return;
    if (controller.action_buffer_.isEmpty()) {
        if (controller.ai_active) controller.ai_machine.event("tick");
        return;
    }
    var data = controller.action_buffer_.pop();
    var actionId = controller.action_map[data[data.length - 1]];
    assert(actionId);
    if (DEBUG) {
        var command = JSON.stringify(data);
        controller.update_evaledChars_ += command.length;
        util.log("evaluate action data", command, "\n * action key :", actionId, "\n * evaluated characters (acc.) :", controller.update_evaledChars_);
    }
    model[actionId].apply(model, data);
};

controller.update_prepareGameRound = function() {
    if (DEBUG) controller.update_evaledChars_ = 0;
    controller.action_buffer_.clear();
};

controller.update_startGameRound = function() {
    assert(!controller.update_inGameRound);
    controller.update_inGameRound = true;
    if (model.round_turnOwner === -1) {
        model.bombs_placeMetaObjects();
        model.timer_setupTimer();
        controller.action_localInvoke("round_nextTurn", []);
        if (controller.isHost()) model.weather_calculateNext();
    } else model.round_startsTurn(model.round_turnOwner);
};

controller.update_endGameRound = function() {
    assert(controller.update_inGameRound);
    controller.update_inGameRound = false;
};

controller.action_registerCommands("actions_markUnitActable");

controller.action_registerCommands("actions_markUnitNonActable");

controller.action_registerCommands("actions_trapWait");

controller.action_registerCommands("actions_setStatus");

model.event_define("actions_markUnitNonActable");

model.event_define("actions_markUnitActable");

model.event_define("actions_trapWait");

model.actions_leftActors = util.list(MAX_UNITS_PER_PLAYER, false);

model.actions_canAct = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    var startIndex = model.round_turnOwner * MAX_UNITS_PER_PLAYER;
    if (uid >= startIndex + MAX_UNITS_PER_PLAYER || uid < startIndex) {
        return false;
    } else return model.actions_leftActors[uid - startIndex] === true;
};

model.actions_setStatus = function(uid, canAct) {
    if (DEBUG) util.log("set actable state of uid:", uid, " to ", canAct);
    assert(model.unit_isValidUnitId(uid));
    assert(util.isBoolean(canAct));
    model.actions_leftActors[uid - model.round_turnOwner * MAX_UNITS_PER_PLAYER] = canAct;
};

model.actions_markUnitNonActable = function(uid) {
    model.actions_setStatus(uid, false);
    model.events.actions_markUnitNonActable(uid);
};

model.actions_markUnitActable = function(uid) {
    model.actions_setStatus(uid, true);
    model.events.actions_markUnitActable(uid);
};

model.actions_trapWait = function(uid) {
    if (DEBUG) util.log("unit id:", uid, " got trapped");
    model.actions_setStatus(uid, false);
    model.events.actions_trapWait(uid);
};

model.actions_prepareActors = function(pid) {
    if (DEBUG) util.log("prepare actable stats for player id:", pid);
    assert(model.player_isValidPid(pid));
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    var io = i;
    for (;i < e; i++) {
        model.actions_leftActors[i - io] = model.unit_data[i].owner !== INACTIVE_ID;
    }
};

controller.action_registerCommands("battle_invokeBattle");

controller.action_registerCommands("battle_attackProperty");

model.event_define("battle_invokeBattle");

model.event_define("battle_mainAttack");

model.event_define("battle_counterAttack");

model.event_define("battle_propertyDestroyed");

model.event_define("battle_attackProperty");

controller.defineGameConfig("daysOfPeace", 0, 50, 0);

controller.defineGameScriptable("minrange", 1, MAX_SELECTION_RANGE - 1);

controller.defineGameScriptable("maxrange", 1, MAX_SELECTION_RANGE);

controller.defineGameScriptable("att", 50, 400);

controller.defineGameScriptable("def", 50, 400);

controller.defineGameScriptable("counteratt", 50, 400);

controller.defineGameScriptable("luck", -50, 50);

controller.defineGameScriptable("firstCounter", 0, 1);

controller.defineGameScriptable("terrainDefense", 0, 12);

controller.defineGameScriptable("terrainDefenseModifier", 10, 300);

model.battle_isPeacePhaseActive = function() {
    return model.round_day < controller.configValue("daysOfPeace");
};

model.battle_FIRETYPES = {
    DIRECT: 0,
    INDIRECT: 1,
    BALLISTIC: 2,
    NONE: 3
};

model.battle_WEAPON_KEYS = [ "main_wp", "sec_wp" ];

model.battle_calculateTargets = function(uid, x, y, data, markAttackableTiles) {
    var markInData = typeof data !== "undefined";
    if (!markAttackableTiles) markAttackableTiles = false;
    assert(model.unit_isValidUnitId(uid));
    var unit = model.unit_data[uid];
    var teamId = model.player_data[unit.owner].team;
    var attackSheet = unit.type.attack;
    if (arguments.length === 1) {
        x = unit.x;
        y = unit.y;
    }
    if (DEBUG) util.log("calculate targets for unit id", uid, "at", x, ",", y);
    assert(model.map_isValidPosition(x, y));
    if (arguments.length === 3) assert(util.isBoolean(markAttackableTiles));
    if (typeof attackSheet === "undefined") return false;
    if (model.battle_hasMainWeapon(unit.type) && !model.battle_hasSecondaryWeapon(unit.type) && unit.type.ammo > 0 && unit.ammo === 0) return false;
    var minR = 1;
    var maxR = 1;
    if (unit.type.attack.minrange) {
        controller.prepareTags(x, y, uid);
        minR = controller.scriptedValue(unit.owner, "minrange", unit.type.attack.minrange);
        maxR = controller.scriptedValue(unit.owner, "maxrange", unit.type.attack.maxrange);
    }
    var lX;
    var hX;
    var lY = y - maxR;
    var hY = y + maxR;
    if (lY < 0) lY = 0;
    if (hY >= model.map_height) hY = model.map_height - 1;
    for (;lY <= hY; lY++) {
        var disY = Math.abs(lY - y);
        lX = x - maxR + disY;
        hX = x + maxR - disY;
        if (lX < 0) lX = 0;
        if (hX >= model.map_width) hX = model.map_width - 1;
        for (;lX <= hX; lX++) {
            if (markAttackableTiles) {
                if (model.map_getDistance(x, y, lX, lY) >= minR) {
                    data.setValueAt(lX, lY, 1);
                }
            } else {
                if (model.fog_turnOwnerData[lX][lY] === 0) continue;
                if (model.map_getDistance(x, y, lX, lY) >= minR) {
                    var dmg = -1;
                    var tUnit = model.unit_posData[lX][lY];
                    if (tUnit !== null && model.player_data[tUnit.owner].team !== teamId) {
                        dmg = model.battle_getBaseDamageAgainst(unit, tUnit);
                        if (dmg > 0) {
                            if (markInData) data.setValueAt(lX, lY, dmg); else return true;
                        }
                    }
                }
            }
        }
    }
    return false;
};

model.battle_hasMainWeapon = function(type) {
    var attack = type.attack;
    return typeof attack !== "undefined" && typeof attack.main_wp !== "undefined";
};

model.battle_hasSecondaryWeapon = function(type) {
    var attack = type.attack;
    return typeof attack !== "undefined" && typeof attack.sec_wp !== "undefined";
};

model.battle_getUnitFireType = function(type) {
    if (!model.battle_hasMainWeapon(type) && !model.battle_hasSecondaryWeapon(type)) {
        return model.battle_FIRETYPES.NONE;
    }
    if (typeof type.attack.minrange !== "undefined") {
        var min = type.attack.minrange;
        return min === 1 ? model.battle_FIRETYPES.BALLISTIC : model.battle_FIRETYPES.INDIRECT;
    } else return model.battle_FIRETYPES.DIRECT;
};

model.battle_isIndirectUnit = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    return model.battle_getUnitFireType(model.unit_data[uid].type) === model.battle_FIRETYPES.INDIRECT;
};

model.battle_isBallisticUnit = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    return model.battle_getUnitFireType(model.unit_data[uid].type) === model.battle_FIRETYPES.BALLISTIC;
};

model.battle_canUseMainWeapon = function(attacker, defender) {
    var attack = attacker.type.attack;
    var tType = defender.type.ID;
    var v;
    if (attacker.ammo > 0 && attack.main_wp !== undefined) {
        v = attack.main_wp[tType];
        if (typeof v !== "undefined") return true;
    }
    return false;
};

model.battle_hasTargets = function(uid, x, y) {
    return model.battle_calculateTargets(uid, x, y);
};

model.battle_getBaseDamageAgainst = function(attacker, defender, withMainWp) {
    var attack = attacker.type.attack;
    var tType = defender.type.ID;
    var v;
    if (typeof withMainWp === "undefined") withMainWp = true;
    if (withMainWp && attacker.ammo > 0 && attack.main_wp !== undefined) {
        v = attack.main_wp[tType];
        if (typeof v !== "undefined") return v;
    }
    if (attack.sec_wp !== undefined) {
        v = attack.sec_wp[tType];
        if (typeof v !== "undefined") return v;
    }
    return -1;
};

model.battle_getBattleDamageAgainst = function(attacker, defender, luck, withMainWp, isCounter) {
    if (DEBUG) util.log("calculating battle damage", model.unit_extractId(attacker), "against", model.unit_extractId(attacker));
    if (typeof isCounter === "undefined") isCounter = false;
    assert(util.intRange(luck, 0, 100));
    assert(util.isBoolean(withMainWp));
    assert(util.isBoolean(isCounter));
    var BASE = model.battle_getBaseDamageAgainst(attacker, defender, withMainWp);
    if (BASE === -1) return -1;
    var AHP = model.unit_convertHealthToPoints(attacker);
    var DHP = model.unit_convertHealthToPoints(defender);
    controller.prepareTags(attacker.x, attacker.y);
    var LUCK = parseInt(luck / 100 * controller.scriptedValue(attacker.owner, "luck", 10), 10);
    var ACO = controller.scriptedValue(attacker.owner, "att", 100);
    if (isCounter) ACO += controller.scriptedValue(defender.owner, "counteratt", 0);
    controller.prepareTags(defender.x, defender.y);
    var DCO = controller.scriptedValue(defender.owner, "def", 100);
    var def = model.map_data[defender.x][defender.y].defense;
    var DTR = parseInt(controller.scriptedValue(defender.owner, "terrainDefense", def) * controller.scriptedValue(defender.owner, "terrainDefenseModifier", 100) / 100, 10);
    var damage = (BASE * ACO / 100 + LUCK) * (AHP / 10) * ((200 - (DCO + DTR * DHP)) / 100);
    damage = parseInt(damage, 10);
    if (DEBUG) {
        util.log("results [", BASE, "*", ACO, "/100+", LUCK, "]*(", AHP, "/10)*[(200-(", DCO, "+", DTR, "*", DHP, "))/100] =", damage);
    }
    return damage;
};

model.battle_searchTile_ = function(rx, ry, ax, ay) {
    var x = -1, y = -1;
    if (model.map_isValidPosition(rx - 1, ry) && !model.unit_posData[rx - 1][ry]) {
        x = rx - 1;
        y = ry;
    }
    if (model.map_isValidPosition(rx, ry - 1) && !model.unit_posData[rx][ry - 1]) {
        x = rx;
        y = ry - 1;
    }
    if (model.map_isValidPosition(rx, ry + 1) && !model.unit_posData[rx][ry + 1]) {
        x = rx;
        y = ry + 1;
    }
    if (model.map_isValidPosition(rx + 1, ry) && !model.unit_posData[rx + 1][ry]) {
        x = rx + 1;
        y = ry;
    }
    if (model.map_isValidPosition(rx - 1, ry - 1) && !model.unit_posData[rx - 1][ry - 1]) {
        x = rx - 1;
        y = ry - 1;
    }
    if (model.map_isValidPosition(rx - 1, ry + 1) && !model.unit_posData[rx - 1][ry + 1]) {
        x = rx - 1;
        y = ry + 1;
    }
    if (model.map_isValidPosition(rx + 1, ry - 1) && !model.unit_posData[rx + 1][ry - 1]) {
        x = rx + 1;
        y = ry - 1;
    }
    if (model.map_isValidPosition(rx + 1, ry + 1) && !model.unit_posData[rx + 1][ry + 1]) {
        x = rx + 1;
        y = ry + 1;
    }
    if (x !== -1) {}
};

model.battle_invokeBattle = function(attId, defId, attLuckRatio, defLuckRatio) {
    if (DEBUG) util.log("start battle between", attId, "luck(", attLuckRatio, ") and", defId, "luck(", defLuckRatio, ")");
    assert(model.unit_isValidUnitId(attId));
    assert(util.intRange(attLuckRatio, 0, 100));
    assert(model.unit_isValidUnitId(defId));
    assert(util.intRange(defLuckRatio, 0, 100));
    var attacker = model.unit_data[attId];
    var defender = model.unit_data[defId];
    var indirectAttack = model.battle_isIndirectUnit(attId);
    if (!indirectAttack && controller.scriptedValue(defender.owner, "firstCounter", 0) === 1) {
        if (!model.battle_isIndirectUnit(defId)) {
            var tmp_ = defender;
            defender = attacker;
            attacker = tmp_;
        }
    }
    var aSheets = attacker.type;
    var dSheets = defender.type;
    var attOwner = attacker.owner;
    var defOwner = defender.owner;
    var powerAtt = model.unit_convertHealthToPoints(defender);
    var powerCounterAtt = model.unit_convertHealthToPoints(attacker);
    var damage;
    var retreatVal = powerAtt;
    model.events.battle_invokeBattle(attId, defId, damage);
    var mainWpAttack = model.battle_canUseMainWeapon(attacker, defender);
    damage = model.battle_getBattleDamageAgainst(attacker, defender, attLuckRatio, mainWpAttack, false);
    if (damage !== -1) {
        model.unit_inflictDamage(defId, damage);
        model.events.battle_mainAttack(attId, defId, damage, mainWpAttack);
        powerAtt -= model.unit_convertHealthToPoints(defender);
        if (mainWpAttack) attacker.ammo--;
        powerAtt = parseInt(powerAtt * .1 * dSheets.cost, 10);
        model.co_modifyPowerLevel(attOwner, parseInt(.5 * powerAtt, 10));
        model.co_modifyPowerLevel(defOwner, powerAtt);
        retreatVal = model.unit_convertHealthToPoints(defender) / retreatVal * 100;
        if (retreatVal < 20) {
            retreatVal = model.battle_searchTile_(defender.x, defender.y, attacker.x, attacker.y);
        } else retreatVal = false;
    }
    if (retreatVal && defender.hp > 0 && !model.battle_isIndirectUnit(defId)) {
        mainWpAttack = model.battle_canUseMainWeapon(defender, attacker);
        damage = model.battle_getBattleDamageAgainst(defender, attacker, defLuckRatio, mainWpAttack, true);
        if (damage !== -1) {
            model.unit_inflictDamage(attId, damage);
            model.events.battle_counterAttack(defId, attId, damage, mainWpAttack);
            powerCounterAtt -= model.unit_convertHealthToPoints(attacker);
            if (mainWpAttack) defender.ammo--;
            powerCounterAtt = parseInt(powerCounterAtt * .1 * aSheets.cost, 10);
            model.co_modifyPowerLevel(defOwner, parseInt(.5 * powerCounterAtt, 10));
            model.co_modifyPowerLevel(attOwner, powerCounterAtt);
        }
    }
};

controller.action_registerCommands("bombs_explosionAt");

controller.action_registerCommands("bombs_fireSilo");

controller.action_registerCommands("bonbs_siloRegeneratesIn");

controller.action_registerCommands("bombs_fireCannon");

controller.action_registerCommands("bombs_fireLaser");

model.event_define("bombs_explosionAt");

model.event_define("bombs_startFireSilo");

model.event_define("bombs_siloRegeneratesIn");

model.event_define("bombs_fireCannon");

model.event_define("bombs_fireLaser");

model.bombs_doDamage_ = function(x, y, damage) {
    assert(model.map_isValidPosition(x, y));
    assert(util.isInt(damage) && damage >= 0);
    var unit = model.unit_posData[x][y];
    if (unit) model.unit_inflictDamage(model.unit_extractId(unit), damage, 9);
};

model.bombs_explosionAt = function(tx, ty, range, damage, owner) {
    model.map_doInRange(tx, ty, range, model.bombs_doDamage_, damage);
    model.events.bombs_explosionAt(tx, ty, range, damage, owner);
};

model.bombs_tryToMarkCannonTargets = function(pid, selection, ox, oy, otx, oty, sx, sy, tx, ty, range) {
    assert(model.player_isValidPid(pid));
    var tid = model.player_data[pid].team;
    var osy = sy;
    var result = false;
    for (;sx <= tx; sx++) {
        for (sy = osy; sy >= ty; sy--) {
            if (!model.map_isValidPosition(sx, sy)) continue;
            if (Math.abs(sx - ox) + Math.abs(sy - oy) > range) continue;
            if (Math.abs(sx - otx) + Math.abs(sy - oty) > range) continue;
            if (model.fog_turnOwnerData[sx][sy] <= 0) continue;
            var unit = model.unit_posData[sx][sy];
            if (unit) {
                if (unit.owner !== pid && model.player_data[unit.owner].team !== tid) {
                    selection.setValueAt(sx, sy, 1);
                    result = true;
                }
            }
        }
    }
    return result;
};

model.bombs_markCannonTargets = function(uid, selection) {
    var result;
    var unit = model.unit_data[uid];
    var prop = model.property_posMap[unit.x][unit.y];
    var type = prop.type.ID !== "PROP_INV" ? prop.type : model.bombs_grabPropTypeFromPos(unit.x, unit.y);
    assert(type.cannon);
    selection.setCenter(unit.x, unit.y, INACTIVE_ID);
    var max = type.cannon.range;
    switch (type.cannon.direction) {
      case "N":
        result = model.bombs_tryToMarkCannonTargets(unit.owner, selection, unit.x, unit.y, unit.x, unit.y - max - 1, unit.x - unit + 1, unit.y - 1, unit.x + unit - 1, unit.y - max, max);
        break;

      case "E":
        result = model.bombs_tryToMarkCannonTargets(unit.owner, selection, unit.x, unit.y, unit.x + max + 1, unit.y, unit.x + 1, unit.y + max - 1, unit.x + max, unit.y - max + 1, max);
        break;

      case "W":
        result = model.bombs_tryToMarkCannonTargets(unit.owner, selection, unit.x, unit.y, unit.x - max - 1, unit.y, unit.x - max, unit.y + max - 1, unit.x - 1, unit.y - max + 1, max);
        break;

      case "S":
        result = model.bombs_tryToMarkCannonTargets(unit.owner, selection, unit.x, unit.y, unit.x, unit.y + max + 1, unit.x - max + 1, unit.y + max, unit.x + max - 1, unit.y + 1, max);
        break;
    }
    return result;
};

model.bombs_isCannon = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    var unit = model.unit_data[uid];
    return unit.type.ID === "CANNON_UNIT_INV";
};

model.bombs_isLaser = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    var unit = model.unit_data[uid];
    return unit.type.ID === "LASER_UNIT_INV";
};

model.bombs_isSuicideUnit = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    return typeof model.unit_data[uid].type.suicide !== "undefined";
};

model.bombs_isSilo = function(prid, uid) {
    assert(model.property_isValidPropId(prid));
    assert(model.unit_isValidUnitId(uid));
    var type = model.property_data[prid].type;
    if (!type.rocketsilo) return false;
    if (arguments.length === 2) {
        var fuidType = model.unit_data[uid].type.ID;
        if (type.rocketsilo.fireable.indexOf(fuidType) === -1) return false;
    }
    return true;
};

model.bombs_placeMetaObjectsForCannon_ = function(x, y) {
    var prop = model.property_posMap[x][y];
    var cannon = prop.type.cannon;
    var size = prop.type.bigProperty;
    assert(x - size.x >= 0);
    assert(y - size.y >= 0);
    var ax = x - size.actor[0];
    var ay = y - size.actor[1];
    var ox = x;
    var oy = y;
    for (var xe = x - size.x; x > xe; x--) {
        y = oy;
        for (var ye = y - size.y; y > ye; y--) {
            if (x !== ox || y !== oy) {
                if (DEBUG) util.log("creating invisible property at", x, ",", y);
                model.property_createProperty(prop.owner, x, y, "PROP_INV");
            }
            if (x === ax && y === ay) {
                if (DEBUG) util.log("creating cannon unit at", x, ",", y);
                model.unit_create(prop.owner, x, y, "CANNON_UNIT_INV");
            }
        }
    }
};

model.bombs_placeMetaObjects = function() {
    for (var x = 0, xe = model.map_width; x < xe; x++) {
        for (var y = 0, ye = model.map_height; y < ye; y++) {
            var prop = model.property_posMap[x][y];
            if (prop) {
                if (prop.type.bigProperty && prop.type.cannon) {
                    model.bombs_placeMetaObjectsForCannon_(x, y);
                } else if (prop.type.cannon) {
                    if (DEBUG) util.log("creating cannon unit at", x, ",", y);
                    model.unit_create(prop.owner, x, y, "CANNON_UNIT_INV");
                } else if (prop.type.laser) {
                    if (DEBUG) util.log("creating laser unit at", x, ",", y);
                    model.unit_create(prop.owner, x, y, "LASER_UNIT_INV");
                }
            }
        }
    }
};

model.bombs_grabPropTypeFromPos = function(x, y) {
    while (true) {
        if (y + 1 < model.map_height && model.property_posMap[x][y + 1] && model.property_posMap[x][y + 1].type.ID === "PROP_INV") {
            y++;
            continue;
        }
        break;
    }
    if (model.property_posMap[x][y].type.ID !== "PROP_INV") {
        return model.property_posMap[x][y].type;
    }
    while (true) {
        if (x + 1 < model.map_width && model.property_posMap[x + 1][y] && model.property_posMap[x + 1][y].type.ID !== "PROP_INV") {
            return model.property_posMap[x + 1][y].type;
        }
        break;
    }
    assert(false);
};

model.bombs_canBeFiredBy = model.bombs_isSilo;

model.bombs_fireSilo = function(x, y, tx, ty, owner) {
    assert(model.map_isValidPosition(x, y));
    assert(model.map_isValidPosition(tx, ty));
    assert(model.player_isValidPid(owner));
    var silo = model.property_posMap[x][y];
    var siloId = model.property_extractId(silo);
    var type = silo.type;
    var range = type.rocketsilo.range;
    var damage = model.unit_convertPointsToHealth(type.rocketsilo.damage);
    model.property_changeType(siloId, model.data_tileSheets[type.changeTo]);
    model.events.bombs_startFireSilo(x, y, siloId, tx, ty, range, damage, owner);
    model.bombs_explosionAt(tx, ty, range, damage, owner);
    model.dayEvents_push(model.round_daysToTurns(5), controller.action_convertToInvokeDataArray("property_changeType", [ siloId, type ]));
    model.events.bombs_siloRegeneratesIn(siloId, 5, type);
};

model.bombs_fireCannon = function(ox, oy, x, y) {
    assert(model.map_isValidPosition(x, y));
    assert(model.map_isValidPosition(ox, oy));
    var prop = model.property_posMap[x][y];
    var target = model.unit_posData[x][y];
    var type = model.bombs_grabPropTypeFromPos(ox, oy);
    var target = model.unit_posData[x][y];
    model.unit_inflictDamage(model.unit_extractId(target), model.unit_convertPointsToHealth(type.cannon.damage), 9);
    model.events.bombs_fireCannon(ox, oy, x, y, type.ID);
};

model.bombs_fireLaser = function(x, y) {
    var prop = model.property_posMap[x][y];
    assert(prop);
    var ox = x;
    var oy = y;
    var pid = prop.owner;
    model.events.bombs_fireLaser(ox, oy, prop.type.ID);
    for (var x = 0, xe = model.map_width; x < xe; x++) {
        for (var y = 0, ye = model.map_height; y < ye; y++) {
            if (ox === x || oy === y) {
                var unit = model.unit_posData[x][y];
                if (unit && unit.owner !== pid) {
                    model.unit_inflictDamage(model.unit_extractId(unit), model.unit_convertPointsToHealth(prop.type.laser.damage), 9);
                }
            }
        }
    }
};

model.cfg_configuration = {};

model.client_instances = util.list(MAX_PLAYER, false);

model.client_lastPid = INACTIVE_ID;

model.client_deregisterPlayers = function() {
    for (var i = 0, e = MAX_PLAYER; i < e; i++) {
        model.client_instances[i] = false;
    }
};

model.client_registerPlayer = function(pid) {
    assert(model.player_isValidPid(pid));
    model.client_instances[pid] = true;
    if (model.client_lastPid === -1) model.client_lastPid = pid;
    return true;
};

model.client_deregisterPlayer = function(pid) {
    assert(model.player_isValidPid(pid));
    model.client_instances[pid] = false;
    return true;
};

model.client_isLocalPid = function(pid) {
    assert(model.player_isValidPid(pid));
    return model.client_instances[pid] === true;
};

controller.action_registerCommands("co_deactivateCOP");

controller.action_registerCommands("co_activateCOP");

controller.action_registerCommands("co_activateSCOP");

controller.action_registerCommands("co_modifyPowerLevel");

controller.action_registerCommands("co_detachCommander");

controller.action_registerCommands("co_attachCommander");

model.event_define("co_modifyPowerLevel");

model.event_define("co_activateSCOP");

model.event_define("co_activateCOP");

model.event_define("co_deactivateCOP");

controller.defineGameConfig("co_getStarCost", 5, 5e4, 9e3, 5);

controller.defineGameConfig("co_getStarCostIncrease", 0, 5e4, 1800, 5);

controller.defineGameConfig("co_getStarCostIncreaseSteps", 0, 50, 10);

model.co_MODES = {
    NONE: 0,
    AW1: 1,
    AW2: 2,
    AWDS: 3,
    AWDR: 4
};

model.co_POWER_LEVEL = {
    INACTIVE: 0,
    COP: 1,
    SCOP: 2,
    TSCOP: 3
};

model.co_activeMode = model.co_MODES.AW1;

model.co_data = util.list(MAX_PLAYER, function(i) {
    return {
        power: 0,
        timesUsed: 0,
        level: 0,
        coA: null,
        coB: null,
        detachedTo: INACTIVE_ID
    };
});

model.co_commanderRange = function(pid) {
    assert(util.intRange(pid, 0, MAX_PLAYER - 1));
    assert(model.co_activeMode === model.co_MODES.AWDR);
    if (model.co_data[pid].detachedTo === INACTIVE_ID) return -1;
    return -1;
};

model.co_isInCommanderFocus = function(uid, pid) {
    if (model.co_activeMode !== model.co_MODES.AWDR) return false;
    if (model.co_data[pid].detachedTo === INACTIVE_ID) return false;
    var com = model.units[model.co_data[pid].detachedTo];
    var cx = com.x;
    var cy = com.y;
    var cr = model.co_commanderRange(pid);
    var unit = model.units[uid];
    var x = unit.x;
    var y = unit.y;
    var disX = Math.abs(x - cx);
    if (disX > cr) return false;
    var disY = Math.abs(y - cy);
    if (disX + disY > cr) return false;
    return true;
};

model.co_activatePower_ = function(pid, level, evName) {
    if (DEBUG) util.log("activate power level", level, "for player", pid);
    assert(model.player_isValidPid(pid));
    var data = model.co_data[pid];
    data.power = 0;
    data.level = level;
    data.timesUsed++;
    model.events[evName](pid);
};

model.co_deactivateCOP = function(pid) {
    model.co_activatePower_(pid, model.co_POWER_LEVEL.INACTIVE, "co_deactivateCOP");
};

model.co_activateCOP = function(pid) {
    model.co_activatePower_(pid, model.co_POWER_LEVEL.COP, "co_activateCOP");
};

model.co_activateSCOP = function(pid) {
    model.co_activatePower_(pid, model.co_POWER_LEVEL.SCOP, "co_activateSCOP");
};

model.co_modifyPowerLevel = function(pid, value) {
    assert(model.player_isValidPid(pid));
    var data = model.co_data[pid];
    data.power += value;
    if (data.power < 0) data.power = 0;
    model.events.co_modifyPowerLevel(pid, value);
};

model.co_canActivatePower = function(pid, powerType) {
    assert(model.player_isValidPid(pid));
    assert(util.intRange(powerType, model.co_POWER_LEVEL.INACTIVE, model.co_POWER_LEVEL.TSCOP));
    var co_data = model.co_data[model.round_turnOwner];
    if (co_data.coA === null) return false;
    if (co_data.level !== model.co_POWER_LEVEL.INACTIVE) return false;
    var stars;
    switch (powerType) {
      case model.co_POWER_LEVEL.COP:
        stars = co_data.coA.coStars;
        break;

      case model.co_POWER_LEVEL.SCOP:
        stars = co_data.coA.scoStars;
        break;
    }
    return co_data.power >= model.co_getStarCost(model.round_turnOwner) * stars;
};

model.co_getStarCost = function(pid) {
    assert(model.player_isValidPid(pid));
    var cost = controller.configValue("co_getStarCost");
    var used = model.co_data[pid].timesPowerUsed;
    var maxUsed = controller.configValue("co_getStarCostIncreaseSteps");
    if (used > maxUsed) used = maxUsed;
    cost += used * controller.configValue("co_getStarCostIncrease");
    return cost;
};

model.co_setMainCo = function(pid, type) {
    assert(model.player_isValidPid(pid));
    if (type === null) model.co_data[pid].coA = null; else {
        assert(model.data_coSheets.hasOwnProperty(type));
        model.co_data[pid].coA = model.data_coSheets[type];
    }
};

model.co_setSideCo = function(pid, type) {
    assert(model.player_isValidPid(pid));
    assert(model.data_coSheets.hasOwnProperty(type));
    if (type === null) model.co_data[pid].coB = null; else {
        assert(model.data_coSheets.hasOwnProperty(type));
        model.co_data[pid].coB = model.data_coSheets[type];
    }
};

model.co_detachCommander = function(pid, uid) {
    assert(model.player_isValidPid(pid));
    assert(model.unit_isValidUnitId(uid));
    assert(model.unit_data[uid].owner !== INACTIVE_ID);
    assert(model.co_data[pid].detachedTo !== uid);
    model.co_data[pid].detachedTo = INACTIVE_ID;
};

model.co_attachCommander = function(pid, uid) {
    assert(model.player_isValidPid(pid));
    assert(model.unit_isValidUnitId(uid));
    assert(model.unit_data[uid].owner !== INACTIVE_ID);
    assert(model.co_data[pid].detachedTo === INACTIVE_ID);
    model.co_data[pid].detachedTo = uid;
};

controller.action_registerCommands("coPower_heal");

model.coPower_invokePower = function(pid, powerType) {
    assert(model.player_isValidPid(pid));
    assert(powerType === model.co_POWER_LEVEL.COP || powerType === model.co_POWER_LEVEL.SCOP);
    var coData = model.co_data[pid];
    assert(coData.coA);
    var powerData = powerType === model.co_POWER_LEVEL.COP ? coData.coA.cop.power : coData.coA.scop.power;
    if (powerData.healUnits) {
        controller.action_sharedInvoke("coPower_heal", [ coData.scriptedValueByRules(powerData.healUnits, pid, "target", 0) + model.player_RELATION_MODES.OWN, coData.scriptedValueByRules(powerData.healUnits, pid, "amount", 0) ]);
    }
};

model.coPower_heal = function(pid, mode, amount) {
    assert(model.player_isValidPid(pid));
    assert(mode >= model.player_RELATION_MODES.OWN && mode <= model.player_RELATION_MODES.ENEMY);
    assert(util.intRange(amount, 1, 10));
    var steam = model.player_data[pid].team;
    var units = model.unit_data;
    for (var i = 0, e = units.length; i < e; i++) {
        var unit = units[i];
        var modeMatch = false;
        var team = model.player_data[unit.owner].team;
        if (unit.owner !== INACTIVE_ID) {
            switch (mode) {
              case model.player_RELATION_MODES.OWN:
                if (unit.owner === pid) modeMatch = true;
                break;

              case model.player_RELATION_MODES.ALLIED:
                if (unit.owner !== pid && steam === team) modeMatch = true;
                break;

              case model.player_RELATION_MODES.TEAM:
                if (unit.owner === pid && steam === team) modeMatch = true;
                break;

              case model.player_RELATION_MODES.ENEMY:
                if (steam !== team) modeMatch = true;
                break;
            }
        }
        if (modeMatch) model.unit_heal(i, amount, false);
    }
};

model.data_createParser = function(name, db, list) {
    var parserParts = [];
    var listFn = util.isFunction(list);
    model.event_define("parse_" + name);
    return {
        addHandler: function(cb) {
            assert(util.isFunction(cb));
            parserParts.push(cb);
        },
        parse: function(sheet) {
            assert(util.isString(sheet.ID));
            assert(!db.hasOwnProperty(sheet.ID));
            model.events["parse_" + name](sheet);
            if (listFn) list(sheet); else list.push(sheet.ID);
            db[sheet.ID] = sheet;
        },
        parseAll: function(list) {
            for (var i = 0, e = list.length; i < e; i++) this.parse(list[i]);
        }
    };
};

model.data_addEngineTypeSheets = function() {
    model.data_movetypeParser.parse({
        ID: "NO_MOVE",
        sound: null,
        costs: {
            "*": -1
        }
    });
    model.data_unitParser.parse({
        ID: "CANNON_UNIT_INV",
        cost: 0,
        range: 0,
        movetype: "NO_MOVE",
        vision: 1,
        fuel: 0,
        ammo: 0,
        assets: {}
    });
    model.data_unitParser.parse({
        ID: "LASER_UNIT_INV",
        cost: 0,
        range: 0,
        movetype: "NO_MOVE",
        vision: 1,
        fuel: 0,
        ammo: 0,
        assets: {}
    });
    model.data_tileParser.parse({
        ID: "PROP_INV",
        defense: 0,
        vision: 0,
        capturePoints: 1,
        blocker: true,
        assets: {}
    });
};

model.data_unitSheets = {};

model.data_unitTypes = [];

model.data_simpleAnimatedUnits = {};

model.data_unitParser = model.data_createParser("unit", model.data_unitSheets, function(sheet) {
    model.data_unitTypes.push(sheet.ID);
    if (sheet.assets.simpleAnimated) model.data_simpleAnimatedUnits[sheet.ID] = true;
});

model.data_tileSheets = {};

model.data_propertyTypes = [];

model.data_tileTypes = [];

model.data_tileParser = model.data_createParser("tile", model.data_tileSheets, function(sheet) {
    if (sheet.capturePoints || sheet.rocketsilo || sheet.cannon || sheet.laser) {
        model.data_propertyTypes.push(sheet.ID);
    } else model.data_tileTypes.push(sheet.ID);
});

model.data_weatherSheets = {};

model.data_defaultWeatherSheet = null;

model.data_nonDefaultWeatherTypes = [];

model.data_weatherParser = model.data_createParser("weather", model.data_weatherSheets, function(sheet) {
    if (sheet.defaultWeather) model.data_defaultWeatherSheet = sheet; else model.data_nonDefaultWeatherTypes.push(sheet);
});

model.data_movetypeSheets = {};

model.data_movetypeTypes = [];

model.data_movetypeParser = model.data_createParser("movetype", model.data_movetypeSheets, model.data_movetypeTypes);

model.data_gameModeSheets = {};

model.data_gameModeTypes = [];

model.data_gameModeParser = model.data_createParser("gameMode", model.data_gameModeSheets, model.data_gameModeTypes);

model.data_fractionSheets = {};

model.data_fractionTypes = [];

model.data_fractionParser = model.data_createParser("fraction", model.data_fractionSheets, model.data_fractionTypes);

model.data_fractionParser.addHandler(function(sheet) {
    assert(sheet.hasOwnProperty("music"));
});

model.data_coSheets = {};

model.data_coTypes = [];

model.data_coParser = model.data_createParser("co", model.data_coSheets, model.data_coTypes);

model.data_sounds = null;

model.data_graphics = null;

model.data_menu = null;

model.data_maps = null;

model.data_header = null;

model.data_assets = null;

model.data_tips = null;

model.data_language = {};

model.data_localized = function(key) {
    var result = model.data_language[key];
    return result === undefined ? key : result;
};

model.dayEvents_data = util.list(50, function() {
    return [ null, null, null ];
});

model.dayEvents_push = function(turn, action, args) {
    var list = model.dayEvents_data;
    for (var i = 0, e = list.length; i < e; i++) {
        if (list[i][0] === null) {
            list[i][0] = turn;
            list[i][1] = action;
            list[i][2] = args;
            return;
        }
    }
    assert(false, "day event buffer overflow");
};

model.dayEvents_tick = function() {
    var list = model.dayEvents_data;
    for (var i = 0, e = list.length; i < e; i++) {
        if (list[i][0] === null) continue;
        list[i][0]--;
        if (list[i][0] === 0) {
            var key = list[i][1];
            var args = list[i][2];
            list[i][0] = null;
            list[i][1] = null;
            list[i][2] = null;
            controller.action_localInvoke(key, args);
        }
    }
};

controller.action_registerCommands("factory_produceUnit");

model.event_define("factory_produceUnit");

model.factory_produceUnit = function(x, y, type) {
    if (DEBUG) util.log("factory at postion (", x, ",", y, ") produces a", type);
    assert(model.map_isValidPosition(x, y));
    assert(model.data_unitSheets.hasOwnProperty(type));
    var prop = model.property_posMap[x][y];
    assert(prop !== null);
    model.events.factory_produceUnit(x, y, type);
    var uid = model.unit_create(model.round_turnOwner, x, y, type);
    var cost = model.data_unitSheets[type].cost;
    var pl = model.player_data[prop.owner];
    pl.gold -= cost;
    assert(pl.gold >= 0);
    model.manpower_decreaseManpower(model.round_turnOwner);
    model.actions_markUnitNonActable(uid);
};

model.factory_wish = util.wish();

model.factory_canProduceSomething = function(_prid) {
    if (!model.factory_isFactory(prid)) return false;
    var pid = model.property_data[prid].owner;
    if (pid === INACTIVE_ID) return false;
    model.factory_wish.approve();
    model.events[EV_FACTORY_TYPE_CHECK](model.factory_wish, prid, pid);
    return !model.factory_wish.declined;
};

model.factory_isFactory = function(prid) {
    assert(model.property_isValidPropId(prid));
    return model.property_data[prid].type.builds;
};

model.factoryGenerateBuildMenu = function(prid, menu, markDisabled) {
    assert(model.property_isValidPropId(prid));
    assert(model.factory_isFactory(prid));
    var property = model.property_data[prid];
    assert(model.player_isValidPid(property.owner));
    var availGold = model.player_data[property.owner].gold;
    var unitTypes = model.data_unitTypes;
    var bList = property.type.builds;
    for (var i = 0, e = unitTypes.length; i < e; i++) {
        var key = unitTypes[i];
        var type = model.data_unitSheets[key];
        if (bList.indexOf(type.movetype) === -1) continue;
        if (type.cost <= availGold || markDisabled) menu.addEntry(key, type.cost < availGold);
    }
};

controller.action_registerCommands("fog_recalculateFogMap");

controller.action_registerCommands("fog_modifyVisionAt");

model.event_define("fog_modifyVisionAt");

model.event_define("fog_recalculateFogMap");

controller.defineGameScriptable("vision", 1, 40);

controller.defineGameConfig("fogEnabled", 0, 1, 1);

model.fog_turnOwnerData = util.matrix(MAX_MAP_WIDTH, MAX_MAP_HEIGHT, 0);

model.fog_clientData = util.matrix(MAX_MAP_WIDTH, MAX_MAP_HEIGHT, 0);

model.fog_visibleClientPids = util.list(MAX_PLAYER, false);

model.fog_visibleTurnOwnerPids = util.list(MAX_PLAYER, false);

model.fog_remoteConnectOfPlayer = function(pid) {
    assert(model.player_isValidPid(pid));
};

model.fog_updateVisiblePid = function() {
    var tid = model.player_data[model.client_lastPid].team;
    var totid = model.player_data[model.round_turnOwner].team;
    for (var i = 0, e = MAX_PLAYER; i < e; i++) {
        model.fog_visibleClientPids[i] = model.client_instances[i] === true || model.player_data[i].team === tid;
        model.fog_visibleTurnOwnerPids[i] = i === model.round_turnOwner || totid === model.player_data[i].team;
    }
};

model.fog_modifyVisionAt = function(x, y, pid, range, value) {
    if (pid === INACTIVE_ID) return;
    if (!controller.configValue("fogEnabled")) return;
    assert(model.map_isValidPosition(x, y));
    assert(util.isInt(range) && range >= 0);
    controller.prepareTags(x, y);
    if (range > 0) range = controller.scriptedValue(pid, "vision", range);
    var clientVisible = model.fog_visibleClientPids[pid];
    var turnOwnerVisible = model.fog_visibleTurnOwnerPids[pid];
    if (!clientVisible && !turnOwnerVisible) return;
    if (range === 0) {
        if (clientVisible) model.fog_clientData[x][y] += value;
        if (turnOwnerVisible) model.fog_turnOwnerData[x][y] += value;
    } else {
        var mH = model.map_height;
        var mW = model.map_width;
        var lX;
        var hX;
        var lY = y - range;
        var hY = y + range;
        if (lY < 0) lY = 0;
        if (hY >= mH) hY = mH - 1;
        for (;lY <= hY; lY++) {
            var disY = Math.abs(lY - y);
            lX = x - range + disY;
            hX = x + range - disY;
            if (lX < 0) lX = 0;
            if (hX >= mW) hX = mW - 1;
            for (;lX <= hX; lX++) {
                if (clientVisible) model.fog_clientData[lX][lY] += value;
                if (turnOwnerVisible) model.fog_turnOwnerData[lX][lY] += value;
            }
        }
    }
    model.events.fog_modifyVisionAt(x, y, pid, range, value);
};

model.fog_recalculateFogMap = function() {
    var x;
    var y;
    var xe = model.map_width;
    var ye = model.map_height;
    var fogEnabled = controller.configValue("fogEnabled") === 1;
    for (x = 0; x < xe; x++) {
        for (y = 0; y < ye; y++) {
            if (!fogEnabled) {
                model.fog_clientData[x][y] = 1;
                model.fog_turnOwnerData[x][y] = 1;
            } else {
                model.fog_clientData[x][y] = 0;
                model.fog_turnOwnerData[x][y] = 0;
            }
        }
    }
    if (fogEnabled) {
        for (x = 0; x < xe; x++) {
            for (y = 0; y < ye; y++) {
                var unit = model.unit_posData[x][y];
                if (unit !== null) {
                    var vision = unit.type.vision;
                    if (vision < 0) vision = 0;
                    model.fog_modifyVisionAt(x, y, unit.owner, vision, 1);
                }
                var property = model.property_posMap[x][y];
                if (property !== null) {
                    var vision = property.type.vision;
                    if (vision < 0) vision = 0;
                    model.fog_modifyVisionAt(x, y, property.owner, vision, 1);
                }
            }
        }
    }
    model.events.fog_recalculateFogMap();
};

model.manpower_data = util.list(MAX_PLAYER, 999999);

model.event_on("buildUnit_check", function(wish, factoryId, playerId, type) {
    if (model.manpower_data[playerId] <= 0) wish.decline();
});

model.event_on("buildUnit_invoked", function(factoryId, playerId, type) {
    model.manpower_data[pid]--;
});

controller.action_registerCommands("map_doInRange");

model.map_data = util.matrix(MAX_MAP_WIDTH, MAX_MAP_HEIGHT, null);

model.map_height = -1;

model.map_width = -1;

model.map_getDistance = function(sx, sy, tx, ty) {
    assert(model.map_isValidPosition(sx, sy));
    assert(model.map_isValidPosition(tx, ty));
    return Math.abs(sx - tx) + Math.abs(sy - ty);
};

model.map_isValidPosition = function(x, y) {
    return x >= 0 && y >= 0 && x < model.map_width && y < model.map_height;
};

model.map_doInRange = function(x, y, range, cb, arg) {
    assert(model.map_isValidPosition(x, y));
    assert(util.isInt(range) && range >= 0);
    assert(typeof cb === "function");
    var lX;
    var hX;
    var lY = y - range;
    var hY = y + range;
    if (lY < 0) lY = 0;
    if (hY >= model.map_height) hY = model.map_height - 1;
    for (;lY <= hY; lY++) {
        var disY = Math.abs(lY - y);
        lX = x - range + disY;
        hX = x + range - disY;
        if (lX < 0) lX = 0;
        if (hX >= model.map_width) hX = model.map_width - 1;
        for (;lX <= hX; lX++) {
            if (cb(lX, lY, arg, Math.abs(lX - x) + disY) === false) return;
        }
    }
};

model.map_doInSelection = function(selection, cb, arg) {};

controller.action_registerCommands("move_setUnitPosition");

controller.action_registerCommands("move_clearUnitPosition");

controller.action_registerCommands("move_moveUnitByPath");

model.event_define("move_setUnitPosition");

model.event_define("move_clearUnitPosition");

model.event_define("move_moveUnitByPath");

controller.defineGameScriptable("moverange", 1, MAX_SELECTION_RANGE);

controller.defineGameScriptable("movecost", 1, MAX_SELECTION_RANGE);

model.move_MOVE_CODES = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

model.move_moveUnitByPath = function(way, uid, x, y, noFuelConsumption) {
    assert(model.map_isValidPosition(x, y));
    assert(model.unit_isValidUnitId(uid));
    assert(!util.isUndefined(noFuelConsumption) && util.isBoolean(noFuelConsumption));
    var cX = x;
    var cY = y;
    var unit = model.unit_data[uid];
    var uType = unit.type;
    var mType = model.data_movetypeSheets[uType.movetype];
    var wayIsIllegal = false;
    var lastIndex = way.length - 1;
    var fuelUsed = 0;
    model.events.move_moveUnitByPath(way, uid, x, y);
    for (var i = 0, e = way.length; i < e; i++) {
        switch (way[i]) {
          case model.move_MOVE_CODES.UP:
            if (cY === 0) wayIsIllegal = true;
            cY--;
            break;

          case model.move_MOVE_CODES.RIGHT:
            if (cX === model.map_width - 1) wayIsIllegal = true;
            cX++;
            break;

          case model.move_MOVE_CODES.DOWN:
            if (cY === model.map_height - 1) wayIsIllegal = true;
            cY++;
            break;

          case model.move_MOVE_CODES.LEFT:
            if (cX === 0) wayIsIllegal = true;
            cX--;
            break;
        }
        assert(!wayIsIllegal);
        if (false) {
            lastIndex = i - 1;
            switch (way[i]) {
              case model.move_MOVE_CODES.UP:
                cY++;
                break;

              case model.move_MOVE_CODES.RIGHT:
                cX--;
                break;

              case model.move_MOVE_CODES.DOWN:
                cY--;
                break;

              case model.move_MOVE_CODES.LEFT:
                cX++;
                break;
            }
            assert(lastIndex !== -1);
            break;
        }
        if (noFuelConsumption) fuelUsed += model.move_getMoveCosts(mType, cX, cY);
    }
    unit.fuel -= fuelUsed;
    assert(unit.fuel >= 0);
    if (unit.x >= 0 && unit.y >= 0) {
        var prop = model.property_posMap[unit.x][unit.y];
        if (prop) model.property_resetCapturePoints(model.property_extractId(prop));
        model.move_clearUnitPosition(uid);
    }
    if (model.unit_posData[cX][cY] === null) model.move_setUnitPosition(uid, cX, cY);
};

model.move_clearUnitPosition = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    var unit = model.unit_data[uid];
    var x = unit.x;
    var y = unit.y;
    model.fog_modifyVisionAt(x, y, unit.owner, unit.type.vision, -1);
    model.unit_posData[x][y] = null;
    unit.x = -unit.x;
    unit.y = -unit.y;
    model.events.move_clearUnitPosition(uid);
};

model.move_setUnitPosition = function(uid, x, y) {
    assert(model.unit_isValidUnitId(uid));
    assert(model.map_isValidPosition(x, y));
    var unit = model.unit_data[uid];
    unit.x = x;
    unit.y = y;
    model.unit_posData[x][y] = unit;
    model.fog_modifyVisionAt(x, y, unit.owner, unit.type.vision, 1);
    model.events.move_setUnitPosition(uid, x, y);
};

model.move_getMoveCosts = function(movetype, x, y) {
    assert(model.map_isValidPosition(x, y));
    var v;
    var tmp;
    tmp = model.property_posMap[x][y];
    if (tmp) {
        if (tmp.type.blocker) v = -1; else v = movetype.costs[tmp.type.ID];
    } else v = movetype.costs[model.map_data[x][y].ID];
    if (typeof v === "number") return v;
    v = movetype.costs["*"];
    if (typeof v === "number") return v;
    return -1;
};

model.move_canTypeMoveTo = function(movetype, x, y) {
    if (model.map_isValidPosition(x, y)) {
        if (model.move_getMoveCosts(movetype, x, y) === -1) return false;
        if (model.fog_turnOwnerData[x][y] === 0) return true;
        if (model.unit_posData[x][y] !== null) return false;
        return true;
    }
};

model.move_codeFromAtoB = function(sx, sy, tx, ty) {
    assert(model.map_isValidPosition(sx, sy));
    assert(model.map_isValidPosition(tx, ty));
    assert(model.map_getDistance(sx, sy, tx, ty) === 1);
    if (sx < tx) return model.move_MOVE_CODES.RIGHT;
    if (sx > tx) return model.move_MOVE_CODES.LEFT;
    if (sy < ty) return model.move_MOVE_CODES.DOWN;
    if (sy > ty) return model.move_MOVE_CODES.UP;
    return null;
};

model.move_generatePath = function(stx, sty, tx, ty, selection, movePath) {
    assert(model.map_isValidPosition(stx, sty));
    assert(model.map_isValidPosition(tx, ty));
    var graph = new Graph(selection.data);
    var dsx = stx - selection.centerX;
    var dsy = sty - selection.centerY;
    var start = graph.nodes[dsx][dsy];
    var dtx = tx - selection.centerX;
    var dty = ty - selection.centerY;
    var end = graph.nodes[dtx][dty];
    var path = astar.search(graph.nodes, start, end);
    var cx = stx;
    var cy = sty;
    var cNode;
    movePath.resetValues();
    var movePathIndex = 0;
    for (var i = 0, e = path.length; i < e; i++) {
        cNode = path[i];
        var dir;
        if (cNode.x > cx) dir = model.move_MOVE_CODES.RIGHT; else if (cNode.x < cx) dir = model.move_MOVE_CODES.LEFT; else if (cNode.y > cy) dir = model.move_MOVE_CODES.DOWN; else if (cNode.y < cy) dir = model.move_MOVE_CODES.UP; else util.expect(util.expect.isTrue, false);
        movePath[movePathIndex] = dir;
        movePathIndex++;
        cx = cNode.x;
        cy = cNode.y;
    }
};

model.move_addCodeToPath = function(code, movePath) {
    assert(util.intRange(code, model.move_MOVE_CODES.UP, model.move_MOVE_CODES.LEFT));
    var lastCode = movePath.getLastCode();
    var goBackCode;
    switch (code) {
      case model.move_MOVE_CODES.UP:
        goBackCode = model.move_MOVE_CODES.DOWN;
        break;

      case model.move_MOVE_CODES.DOWN:
        goBackCode = model.move_MOVE_CODES.UP;
        break;

      case model.move_MOVE_CODES.LEFT:
        goBackCode = model.move_MOVE_CODES.RIGHT;
        break;

      case model.move_MOVE_CODES.RIGHT:
        goBackCode = model.move_MOVE_CODES.LEFT;
        break;
    }
    if (lastCode === goBackCode) {
        movePath[movePath.getSize() - 1] = INACTIVE_ID;
        return true;
    }
    var source = controller.stateMachine.data.source;
    var unit = source.unit;
    var fuelLeft = unit.fuel;
    var fuelUsed = 0;
    var points = unit.type.range;
    if (fuelLeft < points) points = fuelLeft;
    movePath[movePath.getSize()] = code;
    var cx = source.x;
    var cy = source.y;
    for (var i = 0, e = movePath.getSize(); i < e; i++) {
        switch (movePath[i]) {
          case model.move_MOVE_CODES.UP:
            cy--;
            break;

          case model.move_MOVE_CODES.DOWN:
            cy++;
            break;

          case model.move_MOVE_CODES.LEFT:
            cx--;
            break;

          case model.move_MOVE_CODES.RIGHT:
            cx++;
            break;
        }
        fuelUsed += controller.stateMachine.data.selection.getValueAt(cx, cy);
    }
    if (fuelUsed > points) {
        movePath[movePath.getSize() - 1] = INACTIVE_ID;
        return false;
    } else return true;
};

model.move_move_fillMoveMapHelper_ = [];

model.move_fillMoveMap = function(source, selection, x, y, unit) {
    if (typeof x !== "number") x = source.x;
    if (typeof y !== "number") y = source.y;
    if (!unit) unit = source.unit;
    assert(model.map_isValidPosition(x, y));
    var toBeChecked;
    var releaseHelper = false;
    if (model.move_move_fillMoveMapHelper_ !== null) {
        toBeChecked = model.move_move_fillMoveMapHelper_;
        model.move_move_fillMoveMapHelper_ = null;
        releaseHelper = true;
    } else toBeChecked = [];
    var mType = model.data_movetypeSheets[unit.type.movetype];
    var player = model.player_data[unit.owner];
    controller.prepareTags(x, y, model.unit_extractId(unit));
    var range = controller.scriptedValue(unit.owner, "moverange", unit.type.range);
    if (unit.fuel < range) range = unit.fuel;
    selection.setCenter(x, y, INACTIVE_ID);
    selection.setValueAt(x, y, range);
    toBeChecked[0] = x;
    toBeChecked[1] = y;
    toBeChecked[2] = range;
    var checker = [ -1, -1, -1, -1, -1, -1, -1, -1 ];
    while (true) {
        var cHigh = -1;
        var cHighIndex = -1;
        for (var i = 0, e = toBeChecked.length; i < e; i += 3) {
            var leftPoints = toBeChecked[i + 2];
            if (leftPoints !== undefined && leftPoints !== null) {
                if (cHigh === -1 || leftPoints > cHigh) {
                    cHigh = leftPoints;
                    cHighIndex = i;
                }
            }
        }
        if (cHighIndex === -1) break;
        var cx = toBeChecked[cHighIndex];
        var cy = toBeChecked[cHighIndex + 1];
        var cp = toBeChecked[cHighIndex + 2];
        toBeChecked[cHighIndex] = null;
        toBeChecked[cHighIndex + 1] = null;
        toBeChecked[cHighIndex + 2] = null;
        if (cx > 0) {
            checker[0] = cx - 1;
            checker[1] = cy;
        } else {
            checker[0] = -1;
            checker[1] = -1;
        }
        if (cx < model.map_width - 1) {
            checker[2] = cx + 1;
            checker[3] = cy;
        } else {
            checker[2] = -1;
            checker[3] = -1;
        }
        if (cy > 0) {
            checker[4] = cx;
            checker[5] = cy - 1;
        } else {
            checker[4] = -1;
            checker[5] = -1;
        }
        if (cy < model.map_height - 1) {
            checker[6] = cx;
            checker[7] = cy + 1;
        } else {
            checker[6] = -1;
            checker[7] = -1;
        }
        for (var n = 0; n < 8; n += 2) {
            if (checker[n] === -1) continue;
            var tx = checker[n];
            var ty = checker[n + 1];
            var cost = model.move_getMoveCosts(mType, tx, ty);
            if (cost !== -1) {
                var cunit = model.unit_posData[tx][ty];
                if (cunit !== null && model.fog_turnOwnerData[tx][ty] > 0 && !cunit.hidden && model.player_data[cunit.owner].team !== player.team) {
                    continue;
                }
                var rest = cp - cost;
                if (rest >= 0 && rest > selection.getValueAt(tx, ty)) {
                    selection.setValueAt(tx, ty, rest);
                    for (var i = 0, e = toBeChecked.length; i <= e; i += 3) {
                        if (toBeChecked[i] === null || i === e) {
                            toBeChecked[i] = tx;
                            toBeChecked[i + 1] = ty;
                            toBeChecked[i + 2] = rest;
                            break;
                        }
                    }
                }
            }
        }
    }
    if (releaseHelper) {
        for (var hi = 0, he = toBeChecked.length; hi < he; hi++) toBeChecked[hi] = null;
        model.move_move_fillMoveMapHelper_ = toBeChecked;
    }
    for (x = 0, xe = model.map_width; x < xe; x++) {
        for (y = 0, ye = model.map_height; y < ye; y++) {
            if (selection.getValueAt(x, y) !== INACTIVE_ID) {
                cost = model.move_getMoveCosts(mType, x, y);
                selection.setValueAt(x, y, cost);
            }
        }
    }
};

controller.action_registerCommands("multistep_nextStep_");

model.event_define("multistep_nextStep_");

model.multistep_nextStep_ = function() {
    controller.stateMachine.event("nextStep");
    model.events.multistep_nextStep_();
};

controller.action_registerCommands("player_noTeamsAreLeft");

controller.action_registerCommands("player_playerGivesUp");

controller.action_registerCommands("player_deactivatePlayer");

model.event_define("player_playerGivesUp");

model.event_define("player_deactivatePlayer");

model.event_define("player_noTeamsAreLeft");

model.player_RELATION_MODES = {
    SAME_OBJECT: -1,
    NONE: 0,
    OWN: 1,
    ALLIED: 2,
    TEAM: 3,
    ENEMY: 4,
    NULL: 5
};

model.player_data = util.list(MAX_PLAYER, function(index) {
    return {
        gold: 0,
        team: INACTIVE_ID,
        name: null
    };
});

model.player_isValidPid = function(pid) {
    assert(model.property_isValidPropId(pid));
    if (pid < 0 || pid >= MAX_PLAYER) return false;
    return model.player_data[pid].team !== INACTIVE_ID;
};

model.player_extractId = function(player) {
    var index = model.player_data.indexOf(player);
    assert(index > -1);
    return index;
};

model.player_deactivatePlayer = function(pid) {
    assert(model.property_isValidPropId(pid));
    var i, e;
    model.events.player_deactivatePlayer(pid);
    i = model.unit_firstUnitId(pid);
    e = model.unit_lastUnitId(pid);
    for (;i < e; i++) {
        if (model.unit_data[i].owner !== INACTIVE_ID) model.unit_destroy(i);
    }
    i = 0;
    e = model.property_data.length;
    for (;i < e; i++) {
        var prop = model.property_data[i];
        if (prop.owner === pid) {
            prop.owner = -1;
            var changeType = prop.type.changeAfterCaptured;
            if (changeType) model.property_changeType(i, changeType);
        }
    }
    model.player_data[pid].team = -1;
    if (!model.player_areEnemyTeamsLeft()) {
        controller.action_localInvoke("player_noTeamsAreLeft");
    }
};

model.player_areEnemyTeamsLeft = function() {
    var player;
    var foundTeam = -1;
    var i = 0;
    var e = model.player_data.length;
    for (;i < e; i++) {
        player = model.player_data[i];
        if (player.team !== -1) {
            if (foundTeam === -1) foundTeam = player.team; else if (foundTeam !== player.team) {
                foundTeam = -1;
                break;
            }
        }
    }
    return foundTeam === -1;
};

model.player_getRelationship = function(pidA, pidB) {
    if (pidA === null || pidB === null) return model.player_RELATION_MODES.NULL;
    if (pidA === -1 || pidB === -1) return model.player_RELATION_MODES.NONE;
    if (model.player_data[pidA].team === -1 || model.player_data[pidB].team === -1) return model.player_RELATION_MODES.NONE;
    if (pidA === pidB) return model.player_RELATION_MODES.OWN;
    var teamA = model.player_data[pidA].team;
    var teamB = model.player_data[pidB].team;
    if (teamA === -1 || teamB === -1) return model.player_RELATION_MODES.NONE;
    if (teamA === teamB) return model.player_RELATION_MODES.ALLIED;
    if (teamA !== teamB) return model.player_RELATION_MODES.ENEMY;
    return model.player_RELATION_MODES.NONE;
};

model.player_getRelationshipUnitNeighbours = function(pid, x, y, mode) {
    assert(model.property_isValidPropId(pid));
    assert(model.map_isValidPosition(x, y));
    var check = model.player_getRelationship;
    var ownCheck = mode === model.player_RELATION_MODES.OWN;
    var i = 0;
    var e = model.unit_data.length;
    if (ownCheck) {
        i = model.unit_firstUnitId(pid);
        e = model.unit_lastUnitId(pid);
    }
    for (;i < e; i++) {
        if (model.unit_getDistance(sid, i) === 1) {
            if (ownCheck || check(pid, model.unit_data[i].owner) === mode) return true;
        }
    }
    return false;
};

model.player_playerGivesUp = function() {
    assert(model.client_isLocalPid(model.round_turnOwner));
    model.player_deactivatePlayer(model.round_turnOwner);
    model.round_nextTurn();
    model.events.player_playerGivesUp(model.round_turnOwner);
};

model.player_noTeamsAreLeft = function() {
    controller.update_endGameRound();
    model.events.player_noTeamsAreLeft();
};

controller.action_registerCommands("property_changeType");

controller.action_registerCommands("property_resetCapturePoints");

controller.action_registerCommands("property_capture");

model.event_define("property_changeType");

model.event_define("property_resetCapturePoints");

model.event_define("property_capture");

controller.defineGameScriptable("captureRate", 50, 9999);

controller.defineGameScriptable("funds", 1, 99999);

controller.defineGameConfig("captureLimit", 0, MAX_PROPERTIES, 0);

model.property_data = util.list(MAX_PROPERTIES + 1, function() {
    return {
        capturePoints: 20,
        owner: -1,
        x: 0,
        y: 0,
        type: null
    };
});

model.property_posMap = util.matrix(MAX_MAP_WIDTH, MAX_MAP_HEIGHT, null);

model.property_isValidPropId = function(prid) {
    return typeof prid === "number" && prid >= 0 && prid < MAX_PROPERTIES;
};

model.property_thereIsAProperty = function(x, y, pid, mode) {
    assert(model.map_isValidPosition(x, y));
    assert(model.player_isValidPid(pid));
    var property = model.property_posMap[x][y];
    return property !== null && model.player_getRelationship(pid, property.owner) === mode;
};

model.property_getByPos = function(x, y) {
    assert(model.map_isValidPosition(x, y));
    return model.property_posMap[x][y];
};

model.property_isPropertyAtTile = function(x, y) {
    assert(model.map_isValidPosition(x, y));
    return model.property_getByPos(x, y) !== null;
};

model.property_extractId = function(property) {
    var index = model.property_data.indexOf(property);
    assert(index !== -1);
    return index;
};

model.property_createProperty = function(pid, x, y, type) {
    var props = model.property_data;
    for (var i = 0, e = props.length; i < e; i++) {
        if (props[i].owner === INACTIVE_ID && !props[i].type) {
            props[i].owner = pid;
            props[i].type = model.data_tileSheets[type];
            props[i].capturePoints = 1;
            props[i].x = x;
            props[i].y = y;
            model.property_posMap[x][y] = props[i];
            return;
        }
    }
    assert(false);
};

model.property_countProperties = function(pid) {
    assert(model.player_isValidPid(pid));
    var n = 0;
    var props = model.property_data;
    for (var i = 0, e = props.length; i < e; i++) {
        if (props[i].owner === pid) n++;
    }
    return n;
};

model.property_capture = function(cid, prid) {
    if (DEBUG) util.log("unit", cid, "capturing property", cid);
    assert(model.property_isValidPropId(prid));
    assert(model.unit_isValidUnitId(cid));
    var selectedUnit = model.unit_data[cid];
    var property = model.property_data[prid];
    var points = parseInt(selectedUnit.hp / 10, 10) + 1;
    points = parseInt(points * controller.scriptedValue(selectedUnit.owner, "captureRate", 100) / 100, 10);
    property.capturePoints -= points;
    if (property.capturePoints <= 0) {
        var x = property.x;
        var y = property.y;
        if (DEBUG) util.log("property", prid, "captured");
        model.fog_modifyVisionAt(x, y, property.type.vision, 1);
        if (property.type.looseAfterCaptured === true) {
            var pid = property.owner;
            model.player_deactivatePlayer(pid);
        }
        var changeType = property.type.changeAfterCaptured;
        if (typeof changeType !== "undefined") {
            model.property_changeType(prid, changeType);
        }
        property.capturePoints = 20;
        property.owner = selectedUnit.owner;
        var capLimit = controller.configValue("captureLimit");
        if (capLimit !== 0 && model.countProperties() >= capLimit) {
            controller.update_endGameRound();
        }
    }
    model.events.property_capture(cid, prid);
};

model.property_resetCapturePoints = function(prid) {
    assert(model.property_isValidPropId(prid));
    model.property_data[prid].capturePoints = 20;
    model.events.property_resetCapturePoints(prid);
};

model.property_isCapturableBy = function(prid, captId) {
    assert(model.property_isValidPropId(prid));
    assert(model.unit_isValidUnitId(captId));
    return model.property_data[prid].type.capturePoints > 0 && model.unit_data[captId].type.captures > 0;
};

model.property_changeType = function(prid, type) {
    assert(model.property_isValidPropId(prid));
    if (typeof type === "string") {
        assert(model.data_propertyTypes.indexOf(type) !== -1);
        model.data_tileSheets[type];
    } else assert(model.data_propertyTypes.indexOf(type.ID) !== -1);
    model.property_data[prid].type = type;
    model.events.property_changeType(prid, type);
};

controller.action_registerCommands("round_nextTurn");

model.event_define("round_nextTurn");

controller.defineGameConfig("round_dayLimit", 0, 999, 0);

model.round_day = 0;

model.round_turnOwner = -1;

model.round_isTurnOwner = function(pid) {
    return model.round_turnOwner === pid;
};

model.round_daysToTurns = function(v) {
    return model.player_data.length * v;
};

model.round_nextTurn = function() {
    var pid = model.round_turnOwner;
    var oid = pid;
    var i, e;
    pid++;
    while (pid !== oid) {
        if (pid === MAX_PLAYER) {
            pid = 0;
            model.round_day++;
            model.dayEvents_tick();
            var round_dayLimit = controller.configValue("round_dayLimit");
            if (round_dayLimit > 0 && model.round_day === round_dayLimit) {
                controller.update_endGameRound();
            }
        }
        if (model.player_data[pid].team !== INACTIVE_ID) break;
        pid++;
    }
    assert(pid !== oid);
    for (i = 0, e = model.property_data.length; i < e; i++) {
        if (model.property_data[i].owner !== pid) continue;
        model.supply_giveFunds(i);
        model.supply_propertyRepairs(i);
        model.supply_propertySupply(i);
    }
    var turnStartSupply = controller.configValue("autoSupplyAtTurnStart") === 1;
    i = model.unit_firstUnitId(pid);
    e = model.unit_lastUnitId(pid);
    for (;i < e; i++) {
        if (model.unit_data[i].owner === INACTIVE_ID) continue;
        model.unit_drainFuel(i);
        if (model.unit_data[i].owner === INACTIVE_ID) continue;
        if (turnStartSupply) model.supply_tryUnitSuppliesNeighbours(i);
    }
    model.round_startsTurn(pid);
};

model.round_startsTurn = function(pid) {
    model.actions_prepareActors(pid);
    model.timer_resetTurnTimer();
    model.round_turnOwner = pid;
    if (model.client_isLocalPid(pid)) model.client_lastPid = pid;
    model.fog_updateVisiblePid();
    model.fog_recalculateFogMap();
    model.events.round_nextTurn();
    if (controller.isHost() && !controller.ai_isHuman(pid)) {
        controller.ai_machine.event("tick");
    }
};

model.rule_global = [];

model.rule_map = util.list(20, null);

model.rule_isValid = function(rule, isMapRule) {
    return true;
};

model.rule_push = function(rule, isMapRule) {
    assert(model.rule_isValid(rule, isMapRule));
    if (isMapRule) model.rule_map.push(rule); else model.rule_global.push(rule);
};

controller.action_registerCommands("supply_suppliesNeighbours");

controller.action_registerCommands("supply_tryUnitSuppliesNeighbours");

controller.action_registerCommands("supply_refillResources");

controller.action_registerCommands("supply_propertyRepairs");

controller.action_registerCommands("supply_propertySupply");

controller.action_registerCommands("supply_giveFunds");

model.event_define("supply_suppliesNeighbours");

model.event_define("supply_refillResources");

model.event_define("supply_propertyRepairs");

model.event_define("supply_propertySupply");

model.event_define("supply_giveFunds");

controller.defineGameScriptable("propertyHeal", 1, 10);

controller.defineGameConfig("autoSupplyAtTurnStart", 0, 1, 1);

model.supply_giveFunds = function(prid) {
    assert(model.property_isValidPropId(prid));
    var prop = model.property_data[prid];
    assert(prop.owner !== INACTIVE_ID);
    var x = prop.x;
    var y = prop.y;
    controller.prepareTags(x, y);
    if (typeof prop.type.funds !== "number") return;
    var funds = controller.scriptedValue(prop.owner, "funds", prop.type.funds);
    if (typeof funds === "number") {
        model.player_data[prop.owner].gold += funds;
        model.events.supply_giveFunds(prid, x, y);
    }
};

model.supply_propertySupply = function(i) {
    assert(model.property_isValidPropId(i));
    var prop = model.property_data[i];
    assert(prop.owner !== INACTIVE_ID);
    if (prop.owner === pid && prop.type.supply) {
        var x = prop.x;
        var y = prop.y;
        var pid = prop.owner;
        var check = model.unit_thereIsAUnit;
        var mode = model.MODE_OWN;
        if (controller.configValue("supplyAlliedUnits") === 1) mode = model.MODE_TEAM;
        if (check(x, y, pid, mode)) {
            var unitTp = model.unit_posData[x][y].type;
            if (prop.type.supply.indexOf(unitTp.ID) !== -1 || prop.type.supply.indexOf(unitTp.movetype) !== -1) {
                model.supply_refillResources(model.unit_posData[x][y]);
                model.events.supply_propertySupply(i, x, y);
            }
        }
    }
};

model.supply_propertyRepairs = function(i) {
    assert(model.property_isValidPropId(i));
    var prop = model.property_data[i];
    assert(prop.owner !== INACTIVE_ID);
    if (prop.type.repairs) {
        var x = prop.x;
        var y = prop.y;
        var pid = prop.owner;
        var check = model.unit_thereIsAUnit;
        var mode = model.MODE_OWN;
        if (controller.configValue("repairAlliedUnits") === 1) mode = model.MODE_TEAM;
        if (check(x, y, pid, mode)) {
            var unitTp = model.unit_posData[x][y].type;
            var value;
            value = prop.type.repairs.get(unitTp.ID);
            if (!value) value = prop.type.repairs.get(unitTp.movetype);
            value = controller.scriptedValue(pid, "propertyHeal", value);
            if (value > 0) {
                model.unit_heal(model.unit_extractId(model.unit_posData[x][y]), model.unit_convertPointsToHealth(value), true);
                model.events.supply_propertyRepairs(i, x, y);
            }
        }
    }
};

model.supply_isSupplyUnit = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    return model.unit_data[uid].type.supply;
};

model.supply_hasSupplyTargetsNearby = function(uid, x, y) {
    assert(model.unit_isValidUnitId(uid));
    assert(model.map_isValidPosition(x, y));
    if (!model.supply_isSupplyUnit(uid)) return false;
    var supplier = model.unit_data[uid];
    return false;
};

model.supply_tryUnitSuppliesNeighbours = function(sid) {
    if (model.supply_isSupplyUnit(sid)) model.supply_suppliesNeighbours(sid);
};

model.supply_suppliesNeighbours = function(sid) {
    assert(model.unit_isValidUnitId(sid));
    var selectedUnit = model.unit_data[sid];
    assert(typeof selectedUnit.type.supply !== "undefined");
    var x = selectedUnit.x;
    var y = selectedUnit.y;
    var pid = selectedUnit.owner;
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    var unitsSupplied = false;
    for (;i < e; i++) {
        if (!model.unit_isValidUnitId(i)) continue;
        if (model.unit_getDistance(sid, i) === 1) {
            if (!unitsSupplied) {
                model.events.supply_suppliesNeighbours(sid, x, y, i);
            }
            unitsSupplied = true;
            model.supply_refillResources(i);
        }
    }
};

model.supply_refillResources = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    var unit = model.unit_data[uid];
    var type = unit.type;
    unit.ammo = type.ammo;
    unit.fuel = type.fuel;
    model.events.supply_refillResources(uid);
};

controller.action_registerCommands("team_transferMoney");

controller.action_registerCommands("team_transferUnit");

controller.action_registerCommands("team_transferProperty");

model.event_define("team_transferMoney");

model.event_define("team_transferUnit");

model.event_define("team_transferProperty");

model.team_MONEY_TRANSFER_STEPS = [ 1e3, 2500, 5e3, 1e4, 25e3, 5e4 ];

model.team_canTransferMoneyToTile = function(pid, x, y) {
    assert(model.map_isValidPosition(x, y));
    assert(model.player_isValidPid(pid));
    var ref;
    if (model.player_data[pid].gold < model.team_MONEY_TRANSFER_STEPS[0]) return false;
    ref = model.unit_posData[x][y];
    if (ref === null || ref.owner === pid) {
        ref = model.property_posMap[x][y];
        if (ref !== null && ref.owner !== pid && ref.owner !== -1) {
            return true;
        }
        return false;
    }
    return true;
};

model.team_addGoldTransferEntries = function(pid, menu) {
    assert(model.player_isValidPid(pid));
    var availGold = model.player_data[pid].gold;
    for (var i = 0, e = model.team_MONEY_TRANSFER_STEPS.length; i < e; i++) {
        if (availGold >= model.team_MONEY_TRANSFER_STEPS[i]) {
            menu.addEntry(model.team_MONEY_TRANSFER_STEPS[i]);
        }
    }
};

model.team_transferMoney = function(spid, tpid, money) {
    assert(model.player_isValidPid(spid));
    assert(model.player_isValidPid(tpid));
    assert(util.inRange(money, model.team_MONEY_TRANSFER_STEPS[0], model.team_MONEY_TRANSFER_STEPS[model.team_MONEY_TRANSFER_STEPS.length - 1]));
    var sPlayer = model.player_data[spid];
    var tPlayer = model.player_data[tpid];
    util.expect(util.expect.isTrue, money <= sPlayer);
    sPlayer.gold -= money;
    tPlayer.gold += money;
    model.events.team_transferMoney(spid, tpid, money);
};

model.team_transferMoneyByTile = function(spid, x, y, money) {
    assert(model.player_isValidPid(spid));
    assert(model.map_isValidPosition(x, y));
    assert(util.inRange(money, model.team_MONEY_TRANSFER_STEPS[0], model.team_MONEY_TRANSFER_STEPS[model.team_MONEY_TRANSFER_STEPS.length - 1]));
    var owner = model.property_posMap[x][y] !== null ? model.property_posMap[x][y].owner : model.unit_posData[x][y].owner;
    model.team_transferMoney(spid, owner, money);
};

model.team_transferUnit = function(suid, tplid) {
    assert(model.unit_isValidUnitId(suid));
    assert(model.player_isValidPid(tplid));
    var selectedUnit = model.unit_data[suid];
    var tx = selectedUnit.x;
    var ty = selectedUnit.y;
    var opid = selectedUnit.owner;
    selectedUnit.owner = INACTIVE_ID;
    if (model.player_data[tplid].team !== model.player_data[opid].team) {
        model.fog_modifyVisionAt(tx, ty, selectedUnit.type.vision, -1);
    }
    model.move_clearUnitPosition(suid);
    model.unit_create(tplid, tx, ty, selectedUnit.type.ID);
    var targetUnit = model.unit_posData[tx][ty];
    targetUnit.hp = selectedUnit.hp;
    targetUnit.ammo = selectedUnit.ammo;
    targetUnit.fuel = selectedUnit.fuel;
    targetUnit.exp = selectedUnit.exp;
    targetUnit.type = selectedUnit.type;
    targetUnit.x = tx;
    targetUnit.y = ty;
    targetUnit.loadedIn = selectedUnit.loadedIn;
    model.events.team_transferUnit(suid, tplid);
};

model.team_isUnitTransferable = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    return model.transport_hasLoads(uid);
};

model.team_addTransferTargets = function(pid, menu) {
    assert(model.player_isValidPid(pid));
    for (var i = 0, e = MAX_PLAYER; i < e; i++) {
        if (i !== pid && model.player_data[i].team !== INACTIVE_ID) {
            menu.addEntry(i, true);
        }
    }
};

model.team_transferProperty = function(sprid, tplid) {
    assert(model.property_isValidPropId(sprid));
    assert(model.player_isValidPid(tplid));
    var prop = model.property_data[sprid];
    prop.owner = tplid;
    var x;
    var y;
    var xe = model.map_width;
    var ye = model.map_height;
    for (x = 0; x < xe; x++) {
        for (y = 0; y < ye; y++) {
            if (model.property_posMap[x][y] === prop) {}
        }
    }
    model.events.team_transferProperty(sprid, tplid);
};

model.team_isPropertyTransferable = function(prid) {
    assert(model.property_isValidPropId(prid));
    return !model.property_data[prid].type.notTransferable;
};

controller.defineGameConfig("model.timer_turnTimeLimit", 0, 60, 0);

controller.defineGameConfig("model.timer_gameTimeLimit", 0, 99999, 0);

model.timer_turnTimeLimit = 0;

model.timer_gameTimeLimit = 0;

model.timer_gameTimeElapsed = 0;

model.timer_turnTimeElapsed = 0;

model.timer_resetTurnTimer = function() {
    model.timer_turnTimeElapsed = 0;
};

model.timer_updateTimer = function(delta) {
    assert(util.isInt(delta) && delta >= 0);
    model.timer_turnTimeElapsed += delta;
    model.timer_gameTimeElapsed += delta;
    if (model.timer_turnTimeLimit > 0 && model.timer_turnTimeElapsed >= model.timer_turnTimeLimit) {
        controller.action_localInvoke("round_nextTurn", []);
    }
    if (model.timer_gameTimeLimit > 0 && model.timer_gameTimeElapsed >= model.timer_gameTimeLimit) {
        controller.update_endGameRound();
    }
};

model.timer_setupTimer = function() {
    model.timer_turnTimeElapsed = 0;
    model.timer_gameTimeElapsed = 0;
    model.timer_turnTimeLimit = controller.configValue("model.timer_turnTimeLimit") * 6e4;
    model.timer_gameTimeLimit = controller.configValue("model.timer_gameTimeLimit") * 6e4;
};

controller.action_registerCommands("transport_loadInto");

controller.action_registerCommands("transport_unloadFrom");

model.event_define("transport_loadInto");

model.event_define("transport_unloadFrom");

model.transport_hasLoads = function(tid) {
    assert(model.unit_isValidUnitId(tid));
    var pid = model.unit_data[tid].owner;
    for (var i = model.unit_firstUnitId(pid), e = model.unit_lastUnitId(pid); i < e; i++) {
        if (i !== tid) {
            var unit = model.unit_data[i];
            if (unit !== null && unit.loadedIn === tid) return true;
        }
    }
    return false;
};

model.transport_isLoadedBy = function(lid, tid) {
    assert(model.unit_isValidUnitId(lid));
    assert(model.unit_isValidUnitId(tid));
    assert(lid !== tid);
    return model.unit_data[lid].loadedIn === tid;
};

model.transport_loadInto = function(loadId, transportId) {
    assert(model.unit_isValidUnitId(loadId));
    assert(model.unit_isValidUnitId(transportId));
    if (!model.transport_canLoadUnit(loadId, transportId)) {
        assert(false, "transporter unit", transportId, "cannot load unit", loadId);
    }
    model.unit_data[loadId].loadedIn = transportId;
    model.unit_data[transportId].loadedIn--;
    model.events.transport_loadInto(loadId, transportId);
};

model.transport_unloadFrom = function(transportId, trsx, trsy, loadId, tx, ty) {
    assert(model.unit_isValidUnitId(loadId));
    assert(model.unit_isValidUnitId(transportId));
    assert(model.map_isValidPosition(tx, ty));
    assert(model.map_isValidPosition(trsx, trsy));
    assert(model.unit_data[loadId].loadedIn === transportId);
    if (tx === -1 || ty === -1 || model.unit_posData[tx][ty]) {
        return;
    }
    model.unit_data[loadId].loadedIn = -1;
    model.unit_data[transportId].loadedIn++;
    var moveCode;
    if (tx < trsx) moveCode = model.move_MOVE_CODES.LEFT; else if (tx > trsx) moveCode = model.move_MOVE_CODES.RIGHT; else if (ty < trsy) moveCode = model.move_MOVE_CODES.UP; else if (ty > trsy) moveCode = model.move_MOVE_CODES.DOWN;
    model.events.transport_unloadFrom(transportId, trsx, trsy, loadId, tx, ty);
    model.move_moveUnitByPath([ moveCode ], loadId, trsx, trsy, true);
    model.actions_markUnitNonActable(loadId);
};

model.transport_canUnloadUnitsAt = function(uid, x, y) {
    assert(model.unit_isValidUnitId(uid));
    assert(model.map_isValidPosition(x, y));
    var loader = model.unit_data[uid];
    var pid = loader.owner;
    var unit;
    if (!(model.transport_isTransportUnit(uid) && model.transport_hasLoads(uid))) return false;
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    for (;i <= e; i++) {
        unit = model.unit_data[i];
        if (unit.owner !== INACTIVE_ID && unit.loadedIn === uid) {
            var movetp = model.data_movetypeSheets[unit.type.movetype];
            if (model.move_canTypeMoveTo(movetp, x - 1, y)) return true;
            if (model.move_canTypeMoveTo(movetp, x + 1, y)) return true;
            if (model.move_canTypeMoveTo(movetp, x, y - 1)) return true;
            if (model.move_canTypeMoveTo(movetp, x, y + 1)) return true;
        }
    }
    return false;
};

model.transport_addUnloadTargetsToMenu = function(uid, x, y, menu) {
    assert(model.unit_isValidUnitId(uid));
    assert(model.map_isValidPosition(x, y));
    var loader = model.unit_data[uid];
    var pid = loader.owner;
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    var unit;
    for (;i <= e; i++) {
        unit = model.unit_data[i];
        if (unit.owner !== INACTIVE_ID && unit.loadedIn === uid) {
            var movetp = model.data_movetypeSheets[unit.type.movetype];
            if (model.move_canTypeMoveTo(movetp, x - 1, y) || model.move_canTypeMoveTo(movetp, x + 1, y) || model.move_canTypeMoveTo(movetp, x, y - 1) || model.move_canTypeMoveTo(movetp, x, y + 1)) menu.addEntry(i, true);
        }
    }
};

model.transport_addUnloadTargetsToSelection = function(uid, x, y, loadId, selection) {
    assert(model.unit_isValidUnitId(uid));
    assert(model.unit_isValidUnitId(loadId));
    assert(model.map_isValidPosition(x, y));
    var loader = model.unit_data[uid];
    var movetp = model.data_movetypeSheets[model.unit_data[loadId].type.movetype];
    if (model.move_canTypeMoveTo(movetp, x - 1, y)) selection.setValueAt(x - 1, y, 1);
    if (model.move_canTypeMoveTo(movetp, x + 1, y)) selection.setValueAt(x + 1, y, 1);
    if (model.move_canTypeMoveTo(movetp, x, y - 1)) selection.setValueAt(x, y - 1, 1);
    if (model.move_canTypeMoveTo(movetp, x, y + 1)) selection.setValueAt(x, y + 1, 1);
};

model.transport_canLoadUnit = function(lid, tid) {
    assert(model.unit_isValidUnitId(lid));
    assert(model.unit_isValidUnitId(tid));
    assert(tid !== lid);
    var transporter = model.unit_data[tid];
    var load = model.unit_data[lid];
    assert(model.transport_isTransportUnit(tid));
    assert(load.loadedIn !== tid);
    if (transporter.loadedIn + transporter.type.maxloads + 1 === 0) return false;
    return transporter.type.canload.indexOf(load.type.movetype) !== -1;
};

model.transport_isTransportUnit = function(tid) {
    assert(model.unit_isValidUnitId(tid));
    return typeof model.unit_data[tid].type.maxloads === "number";
};

controller.action_registerCommands("unit_inflictDamage");

controller.action_registerCommands("unit_heal");

controller.action_registerCommands("unit_hide");

controller.action_registerCommands("unit_join");

controller.action_registerCommands("unit_unhide");

controller.action_registerCommands("unit_drainFuel");

controller.action_registerCommands("unit_create");

controller.action_registerCommands("unit_destroy");

controller.action_registerCommands("unit_destroySilently");

model.event_define("unit_inflictDamage");

model.event_define("unit_heal");

model.event_define("unit_hide");

model.event_define("unit_join");

model.event_define("unit_unhide");

model.event_define("unit_drainFuel");

model.event_define("unit_create");

model.event_define("unit_destroy");

controller.defineGameScriptable("fuelDrainRate", 50, 100);

controller.defineGameScriptable("fuelDrain", 1, 99);

controller.defineGameConfig("noUnitsLeftLoose", 0, 1, 0);

controller.defineGameConfig("unitLimit", 0, MAX_UNITS_PER_PLAYER, 0);

model.unit_data = util.list(MAX_PLAYER * MAX_UNITS_PER_PLAYER, function() {
    return {
        hp: 99,
        x: 0,
        y: 0,
        ammo: 0,
        fuel: 0,
        loadedIn: -1,
        type: null,
        hidden: false,
        owner: INACTIVE_ID
    };
});

model.unit_posData = util.matrix(MAX_MAP_WIDTH, MAX_MAP_HEIGHT, null);

model.event_on("buildUnit_check", function(wish, factoryId, playerId, type) {
    var uLimit = controller.configValue("unitLimit");
    var count = model.unit_countUnits(playerId);
    if (!uLimit) uLimit = 9999999;
    if (count >= uLimit) wish.decline();
    if (count >= MAX_UNITS_PER_PLAYER) wish.decline();
});

model.unit_isValidUnitId = function(uid) {
    return uid >= 0 && uid < MAX_UNITS_PER_PLAYER * MAX_PLAYER && model.unit_data[uid].owner !== INACTIVE_ID;
};

model.unit_thereIsAUnit = function(x, y, pid, mode) {
    if (!model.map_isValidPosition(x, y)) return false;
    assert(model.player_isValidPid(pid));
    var unit = model.unit_posData[x][y];
    return unit !== null && model.player_getRelationship(pid, unit.owner) === mode;
};

model.unit_firstUnitId = function(pid) {
    return MAX_UNITS_PER_PLAYER * pid;
};

model.unit_lastUnitId = function(pid) {
    return MAX_UNITS_PER_PLAYER * (pid + 1) - 1;
};

model.unit_getByPos = function(x, y) {
    assert(model.map_isValidPosition(x, y));
    return model.unit_posData[x][y];
};

model.unit_extractId = function(unit) {
    assert(unit !== null);
    var index = model.unit_data.indexOf(unit);
    assert(index > -1);
    return index;
};

model.unit_hasFreeSlots = function(pid) {
    assert(model.player_isValidPid(pid));
    var uLimit = controller.configValue("unitLimit");
    if (!uLimit) uLimit = 9999999;
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    var count = 0;
    var res = false;
    for (;i < e; i++) {
        if (model.unit_data[i].owner === INACTIVE_ID) res = true; else {
            count++;
            if (count >= uLimit) return false;
        }
    }
    return res;
};

model.unit_isTileOccupied = function(x, y) {
    assert(model.map_isValidPosition(x, y));
    var unit = model.unit_posData[x][y];
    return unit === null ? -1 : model.unit_extractId(unit);
};

model.unit_countUnits = function(pid) {
    assert(model.player_isValidPid(pid));
    var n = 0;
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    for (;i < e; i++) {
        if (model.unit_data[i].owner !== INACTIVE_ID) n++;
    }
    return n;
};

model.unit_convertHealthToPoints = function(unit) {
    assert(unit.hp > 0 && unit.hp <= 99 && unit.hp % 1 === 0);
    return parseInt(unit.hp / 10) + 1;
};

model.unit_convertHealthToPointsRest = function(unit) {
    assert(util.intRange(unit.hp, 0, 99));
    return unit.hp - (parseInt(unit.hp / 10) + 1);
};

model.unit_convertPointsToHealth = function(pt) {
    assert(util.intRange(pt, 0, 10));
    return pt * 10;
};

model.unit_inflictDamage = function(uid, damage, minRest) {
    assert(model.unit_isValidUnitId(uid));
    assert(util.isInt(damage));
    assert(util.isUndefined(minRest) || util.intRange(minRest, 0, 10));
    var unit = model.unit_data[uid];
    assert(unit !== null);
    unit.hp -= damage;
    if (minRest && unit.hp <= minRest) {
        unit.hp = minRest;
    } else {
        if (unit.hp <= 0) model.unit_destroy(uid);
    }
    model.events.unit_inflictDamage(uid, damage, minRest);
};

model.unit_heal = function(uid, health, diffAsGold) {
    assert(model.unit_isValidUnitId(uid));
    assert(health >= 0 && health % 1 === 0);
    assert(util.isBoolean(diffAsGold) || util.isUndefined(diffAsGold));
    var unit = model.unit_data[uid];
    assert(unit !== null);
    unit.hp += health;
    if (unit.hp > 99) {
        if (diffAsGold === true) {
            var diff = unit.hp - 99;
            model.player_data[unit.owner].gold += parseInt(unit.type.cost * diff / 100, 10);
        }
        unit.hp = 99;
    }
    model.events.unit_heal(uid, health);
};

model.unit_hide = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    model.unit_data[uid].hidden = true;
    model.events.unit_hide(uid);
};

model.unit_unhide = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    model.unit_data[uid].hidden = false;
    model.events.unit_unhide(uid);
};

model.unit_areJoinable = function(juid, jtuid) {
    assert(model.unit_isValidUnitId(juid));
    assert(model.unit_isValidUnitId(jtuid));
    var joinSource = model.unit_data[juid];
    var joinTarget = model.unit_data[jtuid];
    if (model.transport_hasLoads(juid) || model.transport_hasLoads(jtuid)) return false;
    return joinSource.type === joinTarget.type && joinTarget.hp < 90;
};

model.unit_join = function(juid, jtuid) {
    assert(model.unit_isValidUnitId(juid));
    assert(model.unit_isValidUnitId(jtuid));
    var joinSource = model.unit_data[juid];
    var joinTarget = model.unit_data[jtuid];
    assert(joinTarget.type === joinSource.type);
    model.unit_heal(jtuid, model.unit_convertPointsToHealth(model.unit_convertHealthToPoints(joinSource)), true);
    joinTarget.ammo += joinSource.ammo;
    if (joinTarget.ammo > joinTarget.type.ammo) joinTarget.ammo = joinTarget.type.ammo;
    joinTarget.fuel += joinSource.fuel;
    if (joinTarget.fuel > joinTarget.type.fuel) joinTarget.fuel = joinTarget.type.fuel;
    joinSource.owner = INACTIVE_ID;
    model.events.unit_join(juid, jtuid);
};

model.unit_drainFuel = function(uid) {
    assert(model.unit_isValidUnitId(uid));
    var unit = model.unit_data[uid];
    var v = unit.type.dailyFuelDrain;
    if (typeof v === "number") {
        if (unit.hidden && unit.type.dailyFuelDrainHidden) {
            v = unit.type.dailyFuelDrainHidden;
        }
        v = parseInt(controller.scriptedValue(unit.owner, "fuelDrain", v) / 100 * controller.scriptedValue(unit.owner, "fuelDrainRate", 100), 10);
        unit.fuel -= v;
        model.events.unit_drainFuel(uid, v);
        if (unit.fuel <= 0) model.unit_destroy(uid);
    }
};

model.unit_create = function(pid, x, y, type) {
    assert(model.map_isValidPosition(x, y));
    assert(model.player_isValidPid(pid));
    assert(model.data_unitSheets.hasOwnProperty(type));
    var i = model.unit_firstUnitId(pid);
    var e = model.unit_lastUnitId(pid);
    assert(model.unit_hasFreeSlots(pid));
    for (;i < e; i++) {
        if (model.unit_data[i].owner === INACTIVE_ID) {
            var typeSheet = model.data_unitSheets[type];
            var unit = model.unit_data[i];
            unit.hp = 99;
            unit.owner = pid;
            unit.type = typeSheet;
            unit.ammo = typeSheet.ammo;
            unit.fuel = typeSheet.fuel;
            unit.loadedIn = -1;
            model.move_setUnitPosition(i, x, y);
            model.events.unit_create(pid, x, y, type, i);
            return i;
        }
    }
};

model.unit_getDistance = function(uidA, uidB) {
    assert(model.unit_isValidUnitId(uidA));
    assert(model.unit_isValidUnitId(uidB));
    var uA, uB;
    uA = model.unit_data[uidA];
    uB = model.unit_data[uidB];
    if (uB.x === -1 || uA.x === -1) return -1;
    return Math.abs(uA.x - uB.x) + Math.abs(uA.y - uB.y);
};

model.unit_destroySilently = function(uid, noEvent) {
    assert(model.unit_isValidUnitId(uid));
    model.move_clearUnitPosition(uid);
    var unit = model.unit_data[uid];
    unit.owner = INACTIVE_ID;
    if (controller.configValue("noUnitsLeftLoose") === 1 && model.unit_countUnits(unit.owner) === 0) {
        controller.update_endGameRound();
    }
    if (!noEvent) model.events.unit_destroy(uid);
};

model.unit_destroy = function(uid) {
    model.unit_destroySilently(uid, true);
};

controller.action_registerCommands("weather_change");

controller.action_registerCommands("weather_calculateNext");

model.event_define("weather_change");

controller.defineGameScriptable("neutralizeWeather", 0, 1);

controller.defineGameConfig("weatherMinDays", 1, 5, 1);

controller.defineGameConfig("weatherRandomDays", 0, 5, 4);

model.weather_data = null;

model.weather_calculateNext = function() {
    var newTp;
    var duration;
    assert(controller.isHost());
    if (model.weather_data !== null && model.weather_data === model.data_defaultWeatherSheet) {
        var list = model.data_nonDefaultWeatherTypes;
        newTp = list[parseInt(Math.random() * list.length, 10)].ID;
        duration = 1;
    } else {
        newTp = model.data_defaultWeatherSheet.ID;
        duration = controller.configValue("weatherMinDays") + parseInt(controller.configValue("weatherRandomDays") * Math.random(), 10);
    }
    controller.action_sharedInvoke("weather_change", [ newTp ]);
    model.dayEvents_push(model.round_daysToTurns(duration), "weather_calculateNext", []);
};

model.weather_change = function(wth) {
    assert(model.data_weatherSheets.hasOwnProperty(wth));
    model.weather_data = model.data_weatherSheets[wth];
    model.fog_recalculateFogMap();
    model.events.weather_change(wth);
};

model.event_on("prepare_game", function(dom) {
    for (var i = 0, e = model.actions_leftActors.length; i < e; i++) {
        model.actions_leftActors[i] = false;
    }
});

model.event_on("load_game", function(dom) {
    assert(Array.isArray(dom.actr));
    var i = dom.actr.length;
    while (i--) {
        assert(util.intRange(dom.actr[i], 0, MAX_UNITS_PER_PLAYER));
        model.actions_leftActors[dom.actr[i]] = true;
    }
});

model.event_on("save_game", function(dom) {
    var arr = [];
    for (var i = 0, e = model.actions_leftActors.length; i < e; i++) {
        if (model.actions_leftActors[i]) arr.push(i);
    }
    dom.actr = arr;
});

model.event_on("prepare_game", function(dom) {
    controller.buildRoundConfig(null);
});

model.event_on("load_game", function(dom) {
    var keys = Object.keys(dom.cfg);
    var i = keys.length;
    while (i--) {
        assert(util.isInt(dom.cfg[keys[i]]));
    }
    controller.buildRoundConfig(dom.cfg);
});

model.event_on("save_game", function(dom) {
    dom.cfg = model.cfg_configuration;
});

model.event_on("prepare_game", function(dom) {
    model.client_lastPid = INACTIVE_ID;
});

model.event_on("prepare_game", function(dom) {
    var target, i, e;
    i = 0;
    e = MAX_PLAYER;
    for (;i < e; i++) {
        target = model.co_data[i];
        target.power = 0;
        target.timesUsed = 0;
        target.level = INACTIVE_ID;
        target.coA = null;
        target.coB = null;
    }
});

model.event_on("load_game", function(dom) {
    var source, target, i, e;
    assert(Array.isArray(dom.co) && dom.co.length === MAX_PLAYER);
    i = 0;
    e = MAX_PLAYER;
    for (;i < e; i++) {
        source = dom.co[i];
        if (source > 0) {
            assert(util.intRange(source[0], 0, 999999));
            assert(util.intRange(source[1], 0, 999999));
            assert(util.intRange(source[2], model.co_MODES.NONE, model.co_MODES.AWDR));
            assert(util.isString(source[3]) && model.data_coSheets.hasOwnProperty(source[3]));
            assert(util.isString(source[4]) && model.data_coSheets.hasOwnProperty(source[4]));
            target = model.co_data[i];
            target.power = source[0];
            target.timesUsed = source[1];
            target.level = source[2];
            target.coA = source[3] ? model.data_coSheets[source[3]] : null;
            target.coB = source[4] ? model.data_coSheets[source[4]] : null;
        }
    }
});

model.event_on("save_game", function(dom) {
    var data = [];
    var obj;
    for (var i = 0, e = MAX_PLAYER; i < e; i++) {
        obj = model.co_data[i];
        if (model.player_data[i].team === INACTIVE_ID) {
            data.push(0);
        } else {
            data.push([ obj.power, obj.timesUsed, obj.level, obj.coA, obj.coB ]);
        }
    }
    dom.co = data;
});

model.event_on("prepare_game", function(dom) {
    var list = model.dayEvents_data;
    for (i = 0, e = list.length; i < e; i++) {
        list[i][0] = null;
        list[i][1] = null;
        list[i][2] = null;
    }
});

model.event_on("load_game", function(dom) {
    var list = model.dayEvents_data;
    var i = 0;
    var e = dom.dyev.length;
    for (;i < e; i++) {
        assert(util.isInt(list[i][0]) && list[i][0] >= 0);
        assert(util.isString(list[i][1]));
        assert(Array.isArray(list[i][2]));
        list[i][0] = dom.dyev[i][0];
        list[i][1] = dom.dyev[i][1];
        list[i][2] = dom.dyev[i][2];
    }
});

model.event_on("save_game", function(dom) {
    dom.dyev = [];
    var i = 0;
    var e = model.dayEvents_data.length;
    for (;i < e; i++) {
        if (model.dayEvents_data[i] !== null) {
            dom.dyev.push(model.dayEvents_data[i]);
        }
    }
});

model.event_on("prepare_game", function(dom) {
    model.manpower_data.resetValues();
});

model.event_on("load_game", function(dom) {
    assert(Array.isArray(dom.manpower));
    var i = dom.manpower.length - 1;
    do {
        assert(util.isInt(dom.manpower[i]) && dom.manpower[i] >= 0);
        i--;
    } while (i >= 0);
    model.manpower_data.grabValues(dom.manpower);
});

model.event_on("save_game", function(dom) {
    dom.mpw = model.manpower_data.cloneValues([]);
});

model.event_on("prepare_game", function(dom) {
    model.map_width = dom.mpw;
    model.map_height = dom.mph;
    for (var x = 0, xe = model.map_width; x < xe; x++) {
        for (var y = 0, ye = model.map_height; y < ye; y++) {
            model.unit_posData[x][y] = null;
            model.property_posMap[x][y] = null;
            model.map_data[x][y] = model.data_tileSheets[dom.typeMap[dom.map[x][y]]];
        }
    }
});

model.event_on("save_game", function(dom) {
    dom.mpw = model.map_width;
    dom.mph = model.map_height;
    dom.map = [];
    var mostIdsMap = {};
    var mostIdsMapCurIndex = 0;
    for (var x = 0, xe = model.map_width; x < xe; x++) {
        dom.map[x] = [];
        for (var y = 0, ye = model.map_height; y < ye; y++) {
            var type = dom.map[x][y].ID;
            if (!mostIdsMap.hasOwnProperty(type)) {
                mostIdsMap[type] = mostIdsMapCurIndex;
                mostIdsMapCurIndex++;
            }
            dom.map[x][y] = mostIdsMap[type];
        }
    }
    dom.typeMap = [];
    var typeKeys = Object.keys(mostIdsMap);
    for (var i = 0, e = typeKeys.length; i < e; i++) {
        dom.typeMap[mostIdsMap[typeKeys[i]]] = typeKeys[i];
    }
});

model.event_on("prepare_game", function(dom) {
    assert(util.intRange(dom.player, 2, MAX_PLAYER));
    var player, i, e;
    for (i = 0, e = MAX_PLAYER; i < e; i++) {
        player = model.player_data[i];
        player.name = null;
        player.gold = 0;
        player.team = i <= dom.player - 1 ? i : DESELECT_ID;
    }
});

model.event_on("load_game", function(dom) {
    var data, player, i, e;
    for (i = 0, e = dom.players.length; i < e; i++) {
        data = dom.players[i];
        assert(util.intRange(data[0], 0, MAX_PLAYER - 1));
        assert(util.isString(data[1]));
        assert(util.intRange(data[2], 0, 999999));
        assert(util.intRange(data[3], 0, MAX_PLAYER - 1));
        player = model.player_data[data[0]];
        player.name = data[1];
        player.gold = data[2];
        player.team = data[3];
    }
});

model.event_on("prepare_game", function(dom) {
    var property, data;
    for (var i = 0, e = model.property_data.length; i < e; i++) {
        model.property_data[i].owner = INACTIVE_ID;
        model.property_data[i].type = null;
    }
    for (var i = 0, e = dom.prps.length; i < e; i++) {
        data = dom.prps[i];
        assert(util.intRange(data[0], 0, MAX_PROPERTIES - 1));
        assert(util.intRange(data[1], 0, MAX_MAP_WIDTH - 1));
        assert(util.intRange(data[2], 0, MAX_MAP_HEIGHT - 1));
        assert(util.isString(data[3]) && !util.isUndefined(model.data_tileSheets[data[3]].capturePoints) || typeof model.data_tileSheets[data[3]].cannon !== "undefined" || typeof model.data_tileSheets[data[3]].laser !== "undefined" || typeof model.data_tileSheets[data[3]].rocketsilo !== "undefined");
        assert(util.intRange(data[4], 1, model.data_tileSheets[data[3]].capturePoints) || util.intRange(data[4], -99, -1) || typeof model.data_tileSheets[data[3]].rocketsilo !== "undefined");
        assert(util.intRange(data[5], -1, MAX_PLAYER - 1));
        property = model.property_data[data[0]];
        property.type = model.data_tileSheets[data[3]];
        property.capturePoints = 20;
        property.owner = data[5];
        property.x = data[1];
        property.y = data[2];
        model.property_posMap[data[1]][data[2]] = property;
    }
});

model.event_on("load_game", function(dom) {
    var property;
    for (var i = 0, e = dom.prps.length; i < e; i++) {
        var data = dom.prps[i];
        property = model.property_data[data[0]];
        property.capturePoints = data[4];
    }
});

model.event_on("save_game", function(dom) {
    var prop;
    dom.prps = [];
    for (var i = 0, e = model.property_data.length; i < e; i++) {
        prop = model.property_data[i];
        if (prop.owner !== INACTIVE_ID) {
            dom.prps.push([ i, prop.x, prop.y, prop.type.ID, prop.capturePoints, prop.owner ]);
        }
    }
});

model.event_on("prepare_game", function(dom) {
    model.round_turnOwner = -1;
    model.round_day = 0;
});

model.event_on("load_game", function(dom) {
    assert(util.intRange(dom.trOw, 0, 999999));
    assert(util.intRange(dom.day, 0, 999999));
    model.round_turnOwner = dom.trOw;
    model.round_day = dom.day;
});

model.event_on("save_game", function(dom) {
    dom.trOw = model.round_turnOwner;
    dom.day = model.round_day;
});

model.event_on("prepare_game", function(dom) {
    model.rule_map.resetValues();
});

model.event_on("prepare_game", function(dom) {
    model.timer_resetTurnTimer();
});

model.event_on("load_game", function(dom) {
    assert(util.isInt(dom.gmTm) && dom.gmTm >= 0);
    assert(util.isInt(dom.tnTm) && dom.tnTm >= 0);
    model.timer_gameTimeElapsed = dom.gmTm;
    model.timer_turnTimeElapsed = dom.tnTm;
});

model.event_on("save_game", function(dom) {
    dom.gmTm = model.timer_gameTimeElapsed;
    dom.tnTm = model.timer_turnTimeElapsed;
});

model.event_on("prepare_game", function(dom) {
    for (var i = 0, e = model.unit_data.length; i < e; i++) {
        model.unit_data[i].owner = INACTIVE_ID;
    }
    model.unit_posData.resetValues();
    var data;
    if (dom.units) {
        assert(Array.isArray(dom.units));
        for (var i = 0, e = dom.units.length; i < e; i++) {
            data = dom.units[i];
            assert(util.isInt(data[0]));
            assert(typeof data[1] === "string");
            assert(model.data_unitSheets.hasOwnProperty(data[1]));
            var type = model.data_unitSheets[data[1]];
            assert(model.map_isValidPosition(data[2], data[3]));
            assert(util.intRange(data[4], 1, 99));
            assert(util.intRange(data[5], 0, type.ammo));
            assert(util.intRange(data[6], 0, type.fuel));
            assert(util.isInt(data[7]));
            assert(util.intRange(data[8], -1, MAX_PLAYER - 1));
            var id = data[0];
            var unit = model.unit_data[id];
            unit.type = type;
            unit.x = data[2];
            unit.y = data[3];
            unit.hp = data[4];
            unit.ammo = data[5];
            unit.fuel = data[6];
            unit.loadedIn = data[7];
            unit.owner = data[8];
            model.unit_posData[data[2]][data[3]] = unit;
        }
    }
});

model.event_on("save_game", function(dom) {
    var unit;
    dom.units = [];
    for (var i = 0, e = model.unit_data.length; i < e; i++) {
        unit = model.unit_data[i];
        if (unit.owner !== INACTIVE_ID) {
            dom.units.push([ model.unit_extractId(unit), unit.type.ID, unit.x, unit.y, unit.hp, unit.ammo, unit.fuel, unit.loadedIn, unit.owner ]);
        }
    }
});

model.event_on("prepare_game", function(dom) {
    model.weather_data = model.data_defaultWeatherSheet;
});

model.event_on("load_game", function(dom) {
    assert(model.data_weatherSheets.hasOwnProperty(dom.wth));
    model.weather_data = model.data_weatherSheets[dom.wth];
});

model.event_on("save_game", function(dom) {
    dom.wth = model.weather_data.ID;
});

model.event_on("parse_unit", function(sheet) {
    assertIntRange(sheet.ammo, 0, 9);
    if (sheet.attack) {
        if (!util.isUndefined(sheet.attack.minRange)) {
            assertIntRange(sheet.attack.minRange, 1, 14);
            assertIntRange(sheet.attack.maxRange, 2, 15);
            assert(sheet.attack.maxRange > sheet.attack.minRange);
        }
        for (var i = 0, e = model.battle_WEAPON_KEYS.length; i < e; i++) {}
    }
});

model.event_on("parse_tile", function(sheet) {
    assertIntRange(sheet.defense, 0, 6);
});

model.event_on("parse_tile", function(sheet) {
    if (sheet.suicide !== void 0) {
        assertIntRange(sheet.suicide.damage, 1, 9);
        assertIntRange(sheet.suicide.range, 1, MAX_SELECTION_RANGE);
        if (sheet.suicide.noDamage) {
            var i = sheet.suicide.nodamage.length;
            while (i--) {
                assertStr(sheet.suicide.nodamage[i]);
            }
        }
    }
});

model.event_on("parse_co", function(sheet) {
    assertIntRange(sheet.coStars, -1, 10);
    assertIntRange(sheet.scoStars, -1, 10);
    assert(sheet.coStars !== 0);
    assert(sheet.scoStars !== 0);
    assertList(sheet.d2d);
    assertList(sheet.cop.turn);
    assertList(sheet.scop.turn);
    assert(sheet.cop.power);
    assert(sheet.scop.power);
    assertStr(sheet.faction);
    assertStr(sheet.music);
});

model.event_on("parse_unit", function(sheet) {
    assertIntRange(sheet.cost, 0, 999999);
});

model.event_on("parse_tile", function(sheet) {
    if (sheet.builds) {
        assertList(sheet.builds);
        var i = sheet.builds.length;
        while (i--) {
            assertStr(sheet.builds[i]);
        }
    }
});

model.event_on("parse_unit", function(sheet) {
    assertIntRange(sheet.vision, 1, MAX_SELECTION_RANGE);
});

model.event_on("parse_tile", function(sheet) {
    if (sheet.vision !== void 0) {
        assertIntRange(sheet.vision, 0, MAX_SELECTION_RANGE);
    }
});

model.event_on("parse_movetype", function(sheet) {
    var keys, key, i, value;
    assert(sheet.costs);
    keys = Object.keys(sheet.costs);
    i = keys.length;
    while (i--) {
        key = keys[i];
        assertStr(key);
        assert(key === "*" || model.data_tileSheets.hasOwnProperty(key));
        value = sheet.costs[key];
        assertIntRange(value, -1, MAX_SELECTION_RANGE);
        assert(value !== 0);
    }
});

model.event_on("parse_tile", function(sheet) {
    if (sheet.points !== void 0) {
        assertIntRange(sheet.points, 1, 100);
    }
    if (sheet.funds !== void 0) {
        assertIntRange(sheet.funds, 1, 99999);
    }
});

model.event_on("parse_unit", function(sheet) {
    if (sheet.captures !== void 0) {
        assertIntRange(sheet.captures, 1, 10);
    }
});

model.supply_parseRepair_ = function(sheet) {
    var keys, i;
    if (sheet.repairs) {
        keys = Object.keys(sheet.repairs);
        i = keys.length;
        while (i--) {
            assertIntRange(sheet.repairs[keys[i]], 1, 9);
        }
    }
};

model.event_on("parse_unit", function(sheet) {
    var keys, i;
    if (sheet.supply) {
        i = sheet.supply.length;
        while (i--) {
            assertStr(sheet.supply[i]);
        }
    }
    model.supply_parseRepair_(sheet);
});

model.event_on("parse_tile", model.supply_parseRepair_);

model.event_on("parse_unit", function(sheet) {
    if (sheet.canload) {
        assertIntRange(sheet.maxloads, 1, 5);
        assertList(sheet.canload);
        for (var i = 0, e = sheet.canload.length; i < e; i++) {
            assertStr(sheet.canload[i]);
        }
    }
});

model.event_on("parse_unit", function(sheet) {
    assert(model.data_movetypeSheets.hasOwnProperty(sheet.movetype));
    assertIntRange(sheet.range, 0, MAX_SELECTION_RANGE);
    assertIntRange(sheet.fuel, 0, 99);
    if (sheet.stealth !== void 0) assertBool(sheet.stealth);
});

model.event_on("parse_weather", function(sheet) {
    if (sheet.defaultWeather !== void 0) assertBool(sheet.defaultWeather);
});

controller.action_mapAction({
    key: "activatePower",
    hasSubMenu: true,
    condition: function() {
        return (model.co_activeMode === model.co_MODES.AW1 || model.co_activeMode === model.co_MODES.AW2 || model.co_activeMode === model.co_MODES.AWDS) && model.co_canActivatePower(model.round_turnOwner, model.co_POWER_LEVEL.COP);
    },
    prepareMenu: function(data) {
        var co_data = model.co_data[model.round_turnOwner];
        data.menu.addEntry("cop");
        if (model.co_canActivatePower(model.round_turnOwner, model.co_POWER_LEVEL.SCOP)) data.menu.addEntry("scop");
    },
    invoke: function(data) {
        var cmd;
        switch (data.action.selectedSubEntry) {
          case "cop":
            cmd = "co_activateCOP";
            break;

          case "scop":
            cmd = "co_activateSCOP";
            break;

          default:
            assert(false, "model.co_model.co_activatePower__");
        }
        controller.action_sharedInvoke(cmd, [ model.round_turnOwner ]);
    }
});

controller.action_unitAction({
    key: "attachCommander",
    condition: function() {
        if (model.co_activeMode !== model.co_MODES.AWDR) return false;
    },
    invoke: function(data) {
        controller.action_sharedInvoke("co_attachCommander", [ model.round_turnOwner, data.source.unitId ]);
    }
});

controller.action_unitAction({
    key: "attack",
    targetSelectionType: "A",
    relation: [ "S", "T", model.player_RELATION_MODES.NONE, model.player_RELATION_MODES.SAME_OBJECT ],
    prepareTargets: function(data) {
        model.battle_calculateTargets(data.source.unitId, data.target.x, data.target.y, data.selection);
    },
    condition: function(data) {
        if (model.battle_isPeacePhaseActive()) return false;
        if (model.battle_isIndirectUnit(data.source.unitId) && data.movePath.data.getSize() > 0) return false;
        return model.battle_hasTargets(data.source.unitId, data.target.x, data.target.y);
    },
    invoke: function(data) {
        if (data.targetselection.unitId !== -1) {
            controller.action_sharedInvoke("battle_invokeBattle", [ data.source.unitId, data.targetselection.unitId, Math.round(Math.random() * 100), Math.round(Math.random() * 100), false ]);
        } else assert(false, "no valid target");
    }
});

controller.action_propertyAction({
    key: "buildUnit",
    propertyAction: true,
    hasSubMenu: true,
    condition: function(data, wish) {
        model.events["buildUnit_check"](wish, data.source.propertyId, model.property_data[data.source.propertyId].owner);
        return !wish.declined;
    },
    prepareMenu: function(data) {
        model.factoryGenerateBuildMenu(data.source.propertyId, data.menu, true);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("factory_produceUnit", [ data.source.x, data.source.y, data.action.selectedSubEntry ]);
    }
});

controller.action_unitAction({
    key: "capture",
    relation: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT, model.player_RELATION_MODES.NONE ],
    relationToProp: [ "S", "T", model.player_RELATION_MODES.ENEMY, model.player_RELATION_MODES.NONE ],
    condition: function(data) {
        return model.property_isCapturableBy(data.target.propertyId, data.source.unitId);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("property_capture", [ data.source.unitId, data.target.propertyId ]);
    }
});

controller.action_unitAction({
    key: "detachCommander",
    condition: function() {
        return model.co_activeMode === model.co_MODES.AWDR;
    },
    invoke: function(data) {
        controller.action_sharedInvoke("co_detachCommander", [ model.round_turnOwner, data.target.x, data.target.y ]);
    }
});

controller.action_mapAction({
    key: "nextTurn",
    condition: function() {
        return true;
    },
    invoke: function() {
        controller.action_sharedInvoke("round_nextTurn", []);
    }
});

controller.action_unitAction({
    key: "fireCannon",
    relation: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return model.bombs_isCannon(data.target.unitId) && model.bombs_markCannonTargets(data.target.unitId, data.selection);
    },
    targetSelectionType: "A",
    prepareTargets: function(data) {
        model.bombs_markCannonTargets(data.target.unitId, data.selection);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("bombs_fireCannon", [ data.target.x, data.target.y, data.targetselection.x, data.targetselection.y ]);
    }
});

controller.action_unitAction({
    key: "fireLaser",
    relation: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return model.bombs_isLaser(data.target.unitId);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("bombs_fireLaser", [ data.target.x, data.target.y ]);
    }
});

controller.action_unitAction({
    key: "unitHide",
    relation: [ "S", "T", model.player_RELATION_MODES.NONE, model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        var unit = data.source.unit;
        return unit.type.stealth && !unit.hidden;
    },
    invoke: function(data) {
        controller.action_sharedInvoke("unit_hide", [ data.source.unitId ]);
    }
});

controller.action_unitAction({
    key: "joinUnits",
    relation: [ "S", "T", model.player_RELATION_MODES.OWN ],
    condition: function(data) {
        return model.unit_areJoinable(data.source.unitId, data.target.unitId);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("unit_join", [ data.source.unitId, data.target.unitId ]);
        controller.action_sharedInvoke("actions_markUnitNonActable", [ data.target.unitId ]);
    }
});

controller.action_unitAction({
    key: "loadUnit",
    relation: [ "S", "T", model.player_RELATION_MODES.OWN ],
    condition: function(data) {
        var tuid = data.target.unitId;
        return model.transport_isTransportUnit(tuid) && model.transport_canLoadUnit(data.source.unitId, tuid);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("transport_loadInto", [ data.source.unitId, data.target.unitId ]);
    }
});

controller.action_unitAction({
    key: "silofire",
    relation: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT, model.player_RELATION_MODES.NONE ],
    relationToProp: [ "S", "T", model.player_RELATION_MODES.NONE ],
    prepareSelection: function(data) {
        data.selectionRange = data.target.property.type.rocketsilo.range;
    },
    isTargetValid: function(data, x, y) {
        return model.map_isValidPosition(x, y);
    },
    condition: function(data) {
        return model.bombs_canBeFiredBy(data.target.propertyId, data.source.unitId);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("bombs_fireSilo", [ data.target.x, data.target.y, data.targetselection.x, data.targetselection.y, data.source.unit.owner ]);
    }
});

controller.action_unitAction({
    key: "explode",
    relation: [ "S", "T", model.player_RELATION_MODES.NONE, model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return model.bombs_isSuicideUnit(data.source.unitId);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("unit_destroySilently", [ data.source.unitId ]);
        controller.action_sharedInvoke("bombs_explosionAt", [ data.target.x, data.target.y, data.source.unit.type.suicide.range, model.unit_convertPointsToHealth(data.source.unit.type.suicide.damage), data.source.unit.owner ]);
    }
});

controller.action_unitAction({
    key: "supplyUnit",
    relation: [ "S", "T", model.player_RELATION_MODES.NONE, model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return model.supply_hasSupplyTargetsNearby(data.source.unitId, data.target.x, data.target.y);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("supply_suppliesNeighbours", [ data.source.unitId ]);
    }
});

controller.action_mapAction({
    key: "transferMoney",
    hasSubMenu: true,
    condition: function(data) {
        if (data.target.x === -1) return;
        return model.team_canTransferMoneyToTile(model.round_turnOwner, data.target.x, data.target.y);
    },
    prepareMenu: function(data) {
        model.team_addGoldTransferEntries(model.round_turnOwner, data.menu);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("team_transferMoneyByTile", [ model.round_turnOwner, data.target.x, data.target.y, data.action.selectedSubEntry ]);
    }
});

controller.action_propertyAction({
    key: "transferProperty",
    hasSubMenu: true,
    relationToProp: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return model.team_isPropertyTransferable(data.source.propertyId);
    },
    prepareMenu: function(data) {
        model.team_addTransferTargets(data.source.property.owner, data.menu);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("team_transferProperty", [ data.source.propertyId, data.action.selectedSubEntry ]);
    }
});

controller.action_unitAction({
    key: "transferUnit",
    hasSubMenu: true,
    relation: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return model.team_isUnitTransferable(data.source.unitId);
    },
    prepareMenu: function(data) {
        model.team_addTransferTargets(data.source.unit.owner, data.menu);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("team_transferUnit", [ data.source.unitId, data.action.selectedSubEntry ]);
    }
});

controller.action_unitAction({
    key: "unhideUnit",
    relation: [ "S", "T", model.player_RELATION_MODES.NONE, model.player_RELATION_MODES.SAME_OBJECT ],
    condition: function(data) {
        return data.source.unit.hidden;
    },
    invoke: function(data) {
        controller.action_sharedInvoke("unit_unhide", [ data.source.unitId ]);
    }
});

controller.action_unitAction({
    key: "unloadUnit",
    multiStepAction: true,
    relation: [ "S", "T", model.player_RELATION_MODES.SAME_OBJECT, model.player_RELATION_MODES.NONE ],
    condition: function(data) {
        return model.transport_canUnloadUnitsAt(data.source.unitId, data.target.x, data.target.y);
    },
    prepareMenu: function(data) {
        model.transport_addUnloadTargetsToMenu(data.source.unitId, data.target.x, data.target.y, data.menu);
    },
    targetSelectionType: "B",
    prepareTargets: function(data) {
        model.transport_addUnloadTargetsToSelection(data.source.unitId, data.target.x, data.target.y, data.action.selectedSubEntry, data.selection);
    },
    invoke: function(data) {
        controller.action_sharedInvoke("transport_unloadFrom", [ data.source.unitId, data.target.x, data.target.y, data.action.selectedSubEntry, data.targetselection.x, data.targetselection.y, true ]);
    }
});

controller.action_unitAction({
    key: "wait",
    relation: [ "S", "T", model.player_RELATION_MODES.NONE, model.player_RELATION_MODES.SAME_OBJECT ],
    invoke: function(data) {
        controller.action_sharedInvoke("actions_markUnitNonActable", [ data.source.unitId ]);
    }
});

util.scoped(function() {
    var menu = {
        data: util.list(20, null),
        size: 0,
        clear: function() {
            this.size = 0;
        },
        addEntry: function(el) {
            if (this.size === 20) throw Error("full");
            this.data[this.size] = el;
            this.size++;
        }
    };
    controller.ai_defineRoutine({
        key: "buildCapturers",
        propAction: true,
        scoring: function(data) {
            var prid = data.source.propertyId;
            if (data.source.unit) return -1;
            if (!model.factory_isFactory(prid)) return -1;
            if (!model.factory_canProduceSomething(prid)) {
                if (DEBUG) util.log("cannot build capturers because no slots left or no man power left");
            }
            menu.clear();
            model.factoryGenerateBuildMenu(prid, menu);
            if (menu.size === 0) return -1;
            var gold = model.player_data[data.source.property.owner].gold;
            for (var i = 0, e = menu.size; i < e; i++) {
                var type = model.data_unitSheets[menu.data[i]];
                if (type.captures && type.cost <= gold) {
                    data.action.selectedSubEntry = type.ID;
                    return controller.ai_SCORE.HIGH;
                }
            }
            return -1;
        },
        prepare: function(data) {
            controller.action_objects.buildUnit.invoke(data);
        }
    });
});

controller.ai_defineRoutine({
    key: "endTurn",
    mapAction: true,
    endsAiTurn: true,
    scoring: function(data) {
        return 1;
    },
    prepare: function(data) {}
});