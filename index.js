var errTo = require('errto');

module.exports = autoesc;
module.exports.errTo = errToWithCatch

function createMagicCallback(originalCallback) {
    return function autoesc_magicCallback(arg) {
        if (typeof(arg) === 'function') {
            return errToWithCatch(originalCallback, arg);
        } else if (typeof(arg) === 'object' && (arg instanceof Error)) {
            return originalCallback(arg);
        } else {
            return originalCallback(null, arg);
        }
    };
}

function errToWithCatch(errback, success) {
    return errTo(errback, catchErrorsTo(errback, success));
}

function catchErrorsTo(errback, func) {
    return function() {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            errback(e);
        }
    };
}

function autoesc(func) {
    return function autoesc_decorated() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length === 0) throw new Error('autoesc function requires at least one argument (a Node-style callback)');
        var originalCallback = args.pop();
        if (typeof(originalCallback) !== 'function') throw new Error('Last argument of autoesc function must be a Node-style callback');
        var magicCallback = createMagicCallback(originalCallback);
        args.push(magicCallback);
        try {
            func.apply(this, args);
        } catch (e) {
            originalCallback(e);
        }
    };
}
