/** 
 * Represents an inactive identical number.
 *
 * @constant
 */
var CWT_INACTIVE_ID = -1;

/** 
 * @constant 
 */
var DEBUG = true;

/** 
 * @constant 
 */
var CWT_ACTIONS_BUFFER_SIZE = 200;

/**
 * The greatest possible map width.
 *
 * @config
 */
var CWT_MAX_MAP_WIDTH = 100;

/**
 * The greatest possible map height.
 *
 * @config
 */
var CWT_MAX_MAP_HEIGHT = 100;

/**
 * Maximum amount of players in the game.
 *
 * @config
 */
var CWT_MAX_PLAYER = 5;

/**
 * The maximum amount of units a player can hold.
 *
 * @config
 */
var CWT_MAX_UNITS_PER_PLAYER = 50;

/**
 * The maximum amount of properties on a map.
 *
 * @config
 */
var CWT_MAX_PROPERTIES = 200;

/**
 * The maximum range to select a target from a selection range.
 *
 * @config
 */
var CWT_MAX_SELECTION_RANGE = 15;

/**
 * This constant can be overwritten for a custom size, but this must be done
 * before the engine will be initialized.
 *
 * @config
 */
var CWT_MAX_BUFFER_SIZE = 200;

/**
 * The engine version tag.
 *
 * @constant 
 */
var CWT_VERSION = "0.3.1";

/**
 * The model layer holds all necessary data for a game round. This layer can be
 * extended to store additional data for game rounds.
 * 
 * If you extend this layer you should follow two rules. At first remember that
 * every property of this layer will be saved in a save game. The current
 * persistence layer implementation uses a json algorithm to serialize all model
 * data. This means you cannot store cyclic data structures in the model layer.
 * Furthermore you should not place functions in this layer because this would
 * not follow the specification of this layer.
 *
 * @namespace
 */
var model      = {};

/**
 * This is the main access layer for the custom wars tactics game client. All
 * data changing actions will be invoked from this layer.
 *
 * The layer itself is build as state machine which represents a player action.
 * Every action starts by a selection of a tile. Which the selected object will
 * be choosen by the state of the tile. An empty tile leads to a map action. An
 * empty (owned) property leads to a property actions like buying an unit. The
 * last option will be choosen if the tile is occupied by an own unit.
 *
 * @namespace
 */
var controller  = {};

/**
 * Some useful utility functions are stored in this layer. This layer contains
 * the logging functions of custom wars tactics. These functions are
 * overwritable to have a custom log behaviour for the game client. As example
 * if you use a graphical logging solution like BlackbirdJs.
 *
 * @namespace
 */
var util        = {};