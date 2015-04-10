/**
 * Created by narendra on 15/3/15.
 */

(function() {
  "use strict";
  pitana.nodeToViewMapping = new pitana.ObjectMap();

  pitana.registerElement = function(ViewConstructor) {
    var ElementPrototype = Object.create(HTMLElement.prototype);
    ElementPrototype.createdCallback = function() {
      var view = new ViewConstructor({
        ele: this
      });
      pitana.nodeToViewMapping.add(this, view);
      view.createdCallback.apply(view, arguments);
    };
    ElementPrototype.attachedCallback = function() {
      var view = pitana.nodeToViewMapping.get(this);
      view.attachedCallback.apply(view, arguments);
    };
    ElementPrototype.detachedCallback = function() {
      var view = pitana.nodeToViewMapping.get(this);
      view.detachedCallback.apply(view, arguments);
      view._endModule();
      pitana.nodeToViewMapping.remove(this);
    };

    if (ViewConstructor.prototype.methods !== undefined) {
      ElementPrototype._commonMethod = function(methodName, args) {
        var view = pitana.nodeToViewMapping.get(this);
        var f = view[methodName];
        if (typeof f === "function") {
          f.apply(view, args);
        }
      };
      //Append method on EP
      ViewConstructor.prototype.methods.map(function(methodName, i) {
        ElementPrototype[methodName] = function() {
          ElementPrototype._commonMethod.call(this, methodName, arguments);
        };
      });
    }

    ElementPrototype.attributeChangedCallback = function(attrName) {
      var view = pitana.nodeToViewMapping.get(this);
      var mainArgs = arguments;
      pitana.util.for(view.accessors, function(config, name) {
        if (name.toLowerCase() === attrName && typeof config.onChange === "string") {
          view[config.onChange].apply(view, mainArgs);
        }
      });
      view.attributeChangedCallback.apply(view, arguments);
    };

    ElementPrototype.getIntegerAttribute = function(attrName, attrObj) {
      var val = this.getAttribute(attrName);
      if (val !== null) {
        return parseInt(val, 10);
      } else {
        return attrObj.default;
      }
    };
    ElementPrototype.setIntegerAttribute = function(attrName, newVal, attrObj) {
      if (typeof newVal === "number" && this[attrName] !== newVal + "") {
        this.setAttribute(attrName, newVal);
      }
    };
    ElementPrototype.getBooleanAttribute = function(attr) {
      var boolStringToBoolean = {
        "true": true,
        "false": false,
        null: false,
        "": true
      };
      var val = boolStringToBoolean[this.getAttribute(attr)];
      if (val === undefined) {
        return false;
      } else {
        return val;
      }
    };
    ElementPrototype.setBooleanAttribute = function(attr, newVal) {
      if (this[attr] !== newVal && typeof newVal === "boolean") {
        if (newVal === true) {
          this.setAttribute(attr, "");
        } else {
          this.removeAttribute(attr);
        }
      }
    };

    if (ViewConstructor.prototype.accessors !== undefined) {
      pitana.util.for(ViewConstructor.prototype.accessors, function(attrObj, attrName) {
        var Prop = {};
        Prop[attrName] = {
          get: function() {
            switch (attrObj.type) {
              case "int":
                return this.getIntegerAttribute(attrName, attrObj);
              case "boolean":
                return this.getBooleanAttribute(attrName, attrObj);
              default:
                return this.getAttribute(attrName);
            }
          },
          set: function(newVal) {
            switch (attrObj.type) {
              case "int":
                this.setIntegerAttribute(attrName, newVal, attrObj);
                break;
              case "boolean":
                this.setBooleanAttribute(attrName, newVal, attrObj);
                break;
              default:
                this.setAttribute(attrName, newVal);
                break;
            }
            if (typeof attrObj.afterSet === "function") {
              attrObj.afterSet.apply(pitana.nodeToViewMapping.get(this), arguments);
            }
          }
        };
        Object.defineProperties(ElementPrototype, Prop);
      });
    }

    if (typeof document.registerElement === "function") {
      var elementName = ViewConstructor.prototype.tagName.split("-").map(function(v) {
        return v.charAt(0).toUpperCase() + v.slice(1);
      }).join("") + "Element";
      window[elementName] = document.registerElement(ViewConstructor.prototype.tagName, {
        prototype: ElementPrototype
      });
    } else {
      throw "document.registerElement not found, make sure you can included WebComponents Polyfill";
    }
  };
})();
