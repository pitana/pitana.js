(function() {
  "use strict";

  pitana.util = {
    //@msg - Message to be logged
    //@param: {String} msg - message to be logged
    log: function() {
      if (pitana.settings.debug === true && pitana.settings.isConsoleAvailable === true) {
        console.log.apply(console, arguments);
      }
    },
    //@msg - Error Message to be logged
    //pitana.util.logError(), can be used to log error messages to console.
    logError: function() {
      if (pitana.settings.debug === true && pitana.settings.isConsoleAvailable === true) {
        console.error.apply(console, arguments);
      }
    },
    //Replacement for _.each over Objects
    for: function(Obj, callback) {
      for (var i in Obj) {
        if (Obj.hasOwnProperty(i) === true) {
          callback(Obj[i], i);
        }
      }
    },
    addProperty: function(obj, prop, getCallback, setCallback) {
      var v;
      //var v = obj[prop]; //Initialise with Old Property Value
      Object.defineProperty(obj, prop, {
        enumerable: true,
        configurable: true,
        get: function() {
          getCallback(v);
          return v;
        },
        set: function(value) {
          v = value;
          setCallback(v);
        }
      });

    }
  };

})();
