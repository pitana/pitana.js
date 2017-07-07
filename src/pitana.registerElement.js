/**
 * Created by narendra on 15/3/15.
 */

(function() {
  "use strict";
  pitana.nodeToViewMapping = new pitana.ObjectMap();

  pitana.register = function(elementProto) {
    if (elementProto.initialize === undefined) {
      elementProto.initialize = function() {
        pitana.HTMLElement.apply(this, arguments);
      };
    }
    pitana.registerElement(pitana.HTMLElement.extend(elementProto));
  };
  pitana.registerElement = function(ViewConstructor) {
    var ElementPrototype = Object.create(HTMLElement.prototype);
    ElementPrototype.createdCallback = function() {
      var view = new ViewConstructor({
        ele: this
      });
      pitana.nodeToViewMapping.add(this, view);
      if (typeof view.createdCallback === "function") {
        view.createdCallback.apply(view, arguments);
      }

    };
    ElementPrototype.attachedCallback = function() {
      var view = pitana.nodeToViewMapping.get(this);
      if (typeof view.attachedCallback === "function") {
        view.attachedCallback.apply(view, arguments);
      }
    };
    ElementPrototype.detachedCallback = function() {
      var view = pitana.nodeToViewMapping.get(this);
      if (view !== undefined) {
        if (typeof view.detachedCallback === "function") {
          view.detachedCallback.apply(view, arguments);
        }
        view._endModule();
        pitana.nodeToViewMapping.remove(this);
      }
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
      if (typeof view.attributeChangedCallback === "function") {
        view.attributeChangedCallback.apply(view, arguments);
      }

    };

    if (ViewConstructor.prototype.accessors !== undefined) {
      pitana.util.for(ViewConstructor.prototype.accessors, function(attrObj, attrName) {
        if (attrObj.type === undefined) {
          attrObj.type = "string";
        }
        var Prop = {};
        Prop[attrName] = {
          get: function() {
            if (pitana.accessorType[attrObj.type] !== undefined && typeof pitana.accessorType[attrObj.type].get === "function") {
              return pitana.accessorType[attrObj.type].get.call(this, attrName, attrObj);
            }
          },
          set: function(newVal) {
            if (pitana.accessorType[attrObj.type] !== undefined && typeof pitana.accessorType[attrObj.type].set === "function") {
              pitana.accessorType[attrObj.type].set.call(this, attrName, newVal, attrObj);
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
        extends : ViewConstructor.prototype.extends,
        prototype: ElementPrototype
      });
    } else {
      throw "document.registerElement not found, make sure you can included WebComponents Polyfill";
    }
  };
})();
