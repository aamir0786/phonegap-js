/**
 * This represents the PhoneGap API itself, and provides a global namespace for accessing
 * information about the state of PhoneGap.
 * @class
 */
var PhoneGap = { };
var phonegap = { };

PhoneGap.desktop = false;

/**
 * Custom pub-sub channel that can have functions subscribed to it
 */
PhoneGap.Channel = function(type) {
    this.type = type;
    this.handlers = {};
    this.guid = 0;
    this.fired = false;
    this.enabled = true;
};

/**
 * Subscribes the given function to the channel. Any time that 
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
PhoneGap.Channel.prototype.subscribe = function(f, c, g) {
    // need a function to call
    if (f == null) { return; }

    var func = f;
    if (typeof c == "object" && f instanceof Function) { func = PhoneGap.close(c, f); }

    g = g || func.observer_guid || f.observer_guid || this.guid++;
    func.observer_guid = g;
    f.observer_guid = g;
    this.handlers[g] = func;
    return g;
};

/**
 * Like subscribe but the function is only called once and then it
 * auto-unsubscribes itself.
 */
PhoneGap.Channel.prototype.subscribeOnce = function(f, c) {
    var g = null;
    var _this = this;
    var m = function() {
        f.apply(c || null, arguments);
        _this.unsubscribe(g);
    }
    if (this.fired) {
	    if (typeof c == "object" && f instanceof Function) { f = PhoneGap.close(c, f); }
        f.apply(this, this.fireArgs);
    } else {
        g = this.subscribe(m);
    }
    return g;
};

/** 
 * Unsubscribes the function with the given guid from the channel.
 */
PhoneGap.Channel.prototype.unsubscribe = function(g) {
    if (g instanceof Function) { g = g.observer_guid; }
    this.handlers[g] = null;
    delete this.handlers[g];
};

/** 
 * Calls all functions subscribed to this channel.
 */
PhoneGap.Channel.prototype.fire = function(e) {
    if (this.enabled) {
        var fail = false;
        for (var item in this.handlers) {
            var handler = this.handlers[item];
            if (handler instanceof Function) {
                var rv = (handler.apply(this, arguments)==false);
                fail = fail || rv;
            }
        }
        this.fired = true;
        this.fireArgs = arguments;
        return !fail;
    }
    return true;
};

/**
 * Calls the provided function only after all of the channels specified
 * have been fired.
 */
PhoneGap.Channel.join = function(h, c) {
    var i = c.length;
    var f = function() {
        if (!(--i)) h();
    }
    for (var j=0; j<i; j++) {
        (!c[j].fired?c[j].subscribeOnce(f):i--);
    }
    if (!i) h();
};

/**
 * Add an initialization function to a queue that ensures it will run and initialize
 * application constructors only once PhoneGap has been initialized.
 * @param {Function} func The function callback you want run once PhoneGap is initialized
 */
PhoneGap.addConstructor = function(func) {
    PhoneGap.onDeviceReady.subscribeOnce(function() {
        try {
            func();
        } catch(e) {
            if (typeof(debug['log']) == 'function') {
                debug.log("Failed to run constructor: " + debug.processMessage(e));
            } else {
                alert("Failed to run constructor: " + e.message);
            }
        }
    });
};

PhoneGap.addExtension = function(name, obj) {
    if (typeof phonegap[name] == 'undefined') {
        phonegap[name] = obj;
    }
};

/**
 * Adds a plugin object to window.plugins
 */
PhoneGap.addPlugin = function(name, obj) {
	if ( !window.plugins ) {
		window.plugins = {};
	}
	if ( !window.plugins[name] ) {
		window.plugins[name] = obj;
	}
};

/**
 * onDOMContentLoaded channel is fired when the DOM content 
 * of the page has been parsed.
 */
PhoneGap.onDOMContentLoaded = new PhoneGap.Channel();

/**
 * onNativeReady channel is fired when the PhoneGap native code
 * has been initialized.
 */
PhoneGap.onNativeReady = new PhoneGap.Channel();

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since 
// it may be called before any PhoneGap JS is ready.
if (typeof _nativeReady !== 'undefined') { PhoneGap.onNativeReady.fire(); }

/**
 * onDeviceReady is fired only after both onDOMContentLoaded and 
 * onNativeReady have fired.
 */
PhoneGap.onDeviceReady = new PhoneGap.Channel();

PhoneGap.Channel.join(function() {
    PhoneGap.onDeviceReady.fire();
}, [ PhoneGap.onDOMContentLoaded, PhoneGap.onNativeReady ]);


// Listen for DOMContentLoaded and notify our channel subscribers
document.addEventListener('DOMContentLoaded', function() {
    PhoneGap.onDOMContentLoaded.fire();
}, false);


// Intercept calls to document.addEventListener and watch for deviceready
PhoneGap.m_document_addEventListener = document.addEventListener;

document.addEventListener = function(evt, handler, capture) {
    if (evt.toLowerCase() == 'deviceready') {
        if (PhoneGap.desktop) {
            window.onload = handler;
            PhoneGap.onDeviceReady.fire();
        } else {
            PhoneGap.onDeviceReady.subscribeOnce(handler);
        }
    } else {
        PhoneGap.m_document_addEventListener.call(document, evt, handler);
    }
};

// Intercept calls to Element.addEventListener for some platforms
PhoneGap.m_element_addEventListener = Element.prototype.addEventListener;

/**
 * For BlackBerry, the touchstart event does not work so we need to do click
 * events when touchstart events are attached.
 */
/*
Element.prototype.addEventListener = function(evt, handler, capture) {
    if (evt === 'touchstart') {
        evt = 'click';
    }
    PhoneGap.m_element_addEventListener.call(this, evt, handler, capture);
};
*/



PhoneGap.watchId = 0;
PhoneGap.callbackId = 0;
PhoneGap.callbacks = {};
PhoneGap.callbacksWatch = {};

/**
 * Exec is always async since not all platforms can get back immediate return values.
 * This will return a value on platforms that support it.
 */
PhoneGap.exec = function(success, fail, clazz, action, args) {
    var callbackId = clazz + PhoneGap.callbackId++;
	PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
	return CommandManager.exec(clazz, action, callbackId, JSON.stringify(args));
};

PhoneGap.callbackSuccess = function(callbackId, args) {
	PhoneGap.callbacks[callbackId].success(args);
	PhoneGap.clearExec(callbackId);
};

PhoneGap.callbackError = function(callbackId, args) {
	PhoneGap.callbacks[callbackId].fail(args);
	PhoneGap.clearExec(callbackId);
};

PhoneGap.clearExec = function(callbackId) {
    delete PhoneGap.callbacks[callbackId];
};


PhoneGap.execSync = function(clazz, action, args) {
	return CommandManager.exec(clazz, action, null, JSON.stringify(args));
};

/* Executing watches is a bit different */


PhoneGap.execWatch = function(success, fail, clazz, action, args) {
	var watchId = PhoneGap.watchId++;
	PhoneGap.callbacksWatch[watchId] = {success:success, fail:fail};
	var error = CommandManager.execWatch(clazz, action, watchId, JSON.stringify(args));
	if (error != '0') {
	    throw error;
	}
	return watchId;
};

PhoneGap.clearWatch = function(clazz, watchId) {
    delete PhoneGap.callbacksWatch[watchId];
    var error = CommandManager.exec(clazz, 'clearWatch', null, JSON.stringify( { watchId: watchId } ) );
    if (error != '0') {
        throw error;
    }
};

PhoneGap.callbackWatchSuccess = function(watchId, args) {
    PhoneGap.callbacksWatch[watchId].success(args);
};

PhoneGap.close = function(context, func, params) {
    if (typeof params === 'undefined') {
        return function() {
            return func.apply(context, arguments);
        }
    } else {
        return function() {
			var args = Array.prototype.slice.call(arguments);
            return func.apply(context, params.concat(args));
        }
    }
};