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
    get: function(attrName) {
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
})();
