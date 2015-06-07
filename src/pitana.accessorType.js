/**
 * Created by narendra on 13/4/15.
 */

(function() {
  "use strict";

  var boolStringToBoolean = {
    "true": true,
    "false": false,
    null: false,
    "": true
  };
  pitana.accessorType = {};

  pitana.accessorType.string = {
    get: function(attrName, attrObj) {
      var val = this.getAttribute(attrName);
      if (val !== null) {
        return val;
      } else {
        return attrObj.default;
      }
    },
    set: function(attrName, newVal, attrObj) {
      this.setAttribute(attrName, newVal);
    }
  };

  pitana.accessorType.int = {
    get: function(attrName, attrObj) {
      var val = this.getAttribute(attrName);
      if (val !== null) {
        return parseInt(val, 10);
      } else {
        return attrObj.default;
      }
    },
    set: function(attrName, newVal, attrObj) {
      if (typeof newVal === "number" && this[attrName] !== newVal + "") {
        this.setAttribute(attrName, newVal);
      }
    }
  };

  pitana.accessorType.boolean = {
    get: function(attrName, attrObj) {
      var val = boolStringToBoolean[this.getAttribute(attrName)];
      if (val === undefined) {
        return false;
      } else {
        return val;
      }
    },
    set: function(attrName, newVal, attrObj) {
      if (this[attrName] !== newVal && typeof newVal === "boolean") {
        if (newVal === true) {
          this.setAttribute(attrName, "");
        } else {
          this.removeAttribute(attrName);
        }
      }
    }
  };


  pitana.accessorType.readOnly = {
    get: function(attrName, attrObj) {
      var view = pitana.nodeToViewMapping.get(this);
      var f = view[attrObj.get];
      if (typeof f === "function") {
        return f.apply(view, arguments);
      }
    },
    set: function(attrName, newVal, attrObj) {
      //Sorry, readOnly access
    }
  };
  pitana.accessorType.json = {
    get: function(attrName, attrObj) {
      if (this["_json_" + attrName + "_init_"] === undefined) {
        var val = this.getAttribute(attrName);
        if (val === null) {
          this["_json_" + attrName] = attrObj.default;
        } else {
          try {
            this["_json_" + attrName] = JSON.stringify(val);
          } catch (ex) {
            this["_json_" + attrName] = {
              jsonParseError: true
            };
          }
        }
        this["_json_" + attrName + "_init_"] = true;
      }
      return this["_json_" + attrName];
    },
    set: function(attrName, newVal, attrObj) {
      var oldVal = this[attrName];
      if (oldVal !== newVal) {
        this["_json_" + attrName] = newVal;
        this.setAttribute(attrName, JSON.stringify(newVal));
      }
    }
  };
})();
