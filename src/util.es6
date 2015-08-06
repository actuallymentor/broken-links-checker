import path  from 'path';

/**
 * @exports
 * @class Util
 * @desc Implements utility methods
 */
export default class Util {
    /**
     * Checks if given object is instance of Object
     * @param {Object|*} obj
     * @returns {boolean} true if obj is instance of Object class
     * @static
     */
    static isObject(obj) {
        return !!obj && typeof obj === 'object';
    }

    /**
     * Checks if given object is instance of Function
     * @param {Object|*} obj
     * @returns {boolean} true if obj is Function
     * @static
     */
    static isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    /**
     * Checks if given object is instance of String
     * @param {Object|*} obj
     * @returns {boolean} true if obj is String
     * @static
     */
    static isString(obj) {
        return typeof obj === 'string' || obj instanceof String;
    }

    static getConfigurationDirectory() {
        return path.join(process.cwd(), './configs');
    }
}