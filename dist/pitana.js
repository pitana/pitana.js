/**
 * Copyright 2012 to now - Narendra Sisodiya, <narendra@narendrasisodiya.com>
 * Licensed under "The MIT License". visit http://nsisodiya.mit-license.org/ to read the License.
 * Visit - https://github.com/pitana/pitana.js
 */
 ;var pitana = {};
(function() {
  "use strict";
  var klass = function(ChildProto) {
    var Child = function() {
      if (typeof ChildProto.initialize === "function") {
        ChildProto.initialize.apply(this, arguments);
      }
    };
    var Parent;
    if (this !== undefined && this.extend === klass) {
      Parent = this;
    } else {
      Parent = Object;
    }
    Child.prototype = Object.create(Parent.prototype);
    Child.prototype.constructor = Child;
    for (var i in ChildProto) {
      if (ChildProto.hasOwnProperty(i) === true) {
        Child.prototype[i] = ChildProto[i];
      }
    }

    Child.extend = klass;
    Child.parent = Parent;
    Child.super = Parent.prototype;
    return Child;
  };
  pitana.klass = klass;
})();
;pitana.Base = pitana.klass({});
;(function() {
  "use strict";
  pitana.settings = {
    preStart: function() {

    },
    preEnd: function() {

    },
    postTemplateProcessing: function(str) {
      return str;
    },
    debug: false,
    isConsoleAvailable: false
  };
})();
;(function() {
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
;(function() {
  "use strict";

  var log = pitana.util.log;
  pitana.EventBus = pitana.Base.extend({
    initialize: function() {
      pitana.Base.apply(this, arguments);
      this._NewsPaperList = {};
      this._OrderList = [];
    },
    //New Syntax
    on: function() {
      return this.subscribe.apply(this, arguments);
    },
    //Old Syntax
    subscribe: function(newsPaper, address) {
      log("subscribed ", newsPaper);
      if ((typeof newsPaper !== "string") || (typeof address !== "function")) {
        return -1;
      }
      var AList = this._NewsPaperList[newsPaper];
      if (typeof AList !== "object") {
        AList = this._NewsPaperList[newsPaper] = [];
      }

      var customer = AList.push(address) - 1;

      return this._OrderList.push({
        newsPaper: newsPaper,
        customer: customer
      }) - 1;
    },
    //New Syntax
    off: function() {
      return this.unsubscribe.apply(this, arguments);
    },
    //Old Syntax
    unsubscribe: function(orderId) {
      var O = this._OrderList[orderId];
      if (O !== undefined) {
        log("unsubscribe ", O.newsPaper);
        delete this._NewsPaperList[O.newsPaper][O.customer];
      }
    },
    //New Syntax
    trigger: function() {
      this.publish.apply(this, arguments);
    },
    //old Syntax
    publish: function(topic) {
      log.apply(null, arguments);
      var Arr = Array.prototype.slice.call(arguments);
      var newsPaper = Arr.slice(0, 1)[0];
      Arr.shift();
      var AddressList = this._NewsPaperList[newsPaper];
      if (typeof AddressList !== "undefined") {
        var l = AddressList.length;
        for (var i = 0; i < l; i++) {
          if (typeof AddressList[i] === "function") {
            AddressList[i].apply(this, Arr);
          }
        }
      }
    }
  });
})();
;(function() {
  "use strict";

  var ElementProto = Element.prototype;
  ElementProto.matchesSelector =
    ElementProto.matches ||
    ElementProto.webkitMatchesSelector ||
    ElementProto.mozMatchesSelector ||
    ElementProto.msMatchesSelector;

  if (!ElementProto.matches) {
    ElementProto.matches = ElementProto.matchesSelector;
  }
  pitana.domEvents = {
    addLiveEventListener: function(ele, eventName, hash, eventCallback, context) {
      var callback = function(e) {
        var currNode = e.target;
        if (hash === "") {
          eventCallback.call(context, e, e.currentTarget, e.currentTarget.dataset);
        } else {
          while (currNode !== e.currentTarget && currNode !== document && currNode !== null) {
            if (currNode.matches(hash) === true) {
              eventCallback.call(context, e, currNode, currNode.dataset);
              break;
            }
            currNode = currNode.parentNode;
          }
        }
      };
      ele.addEventListener(eventName, callback, false);
      return callback;
    },
    trigger: function(target, type, options) {
      if (options === undefined) {
        options = {};
      }
      var event = document.createEvent("CustomEvent");
      event.initCustomEvent(type, options.bubbles !== false, options.cancelable !== false);
      target.dispatchEvent(event);
    }
  };
})();
;(function() {
  "use strict";

  pitana.HTMLElement = pitana.Base.extend({
    initialize: function(data) {
      pitana.Base.apply(this, arguments);
      this.$ = data.ele;

      if (this.template instanceof HTMLTemplateElement) {
        this.$.appendChild(this.template.content.cloneNode(true));
      } else {
        //Loading Template !!
        //TODO -Support for underscore template
        //TODO - Add Sandbox API
        var str = "";
        if (typeof this.template === "string") {
          str = this.template;
        }
        if (typeof this.template === "function") {
          str = this.template();
        }
        this.$.innerHTML = pitana.settings.postTemplateProcessing(str);
      }



      this._viewMetadata = {
        eventBus: pitana.settings.GlobalEventBus,
        topicList: {},
        eventsMap: {}
      };


      //subscribeAll globalEvents();
      var self = this;

      if (this.globalEvents !== undefined) {
        pitana.util.for(this.globalEvents, function(methodName, eventName) {
          self.subscribeGlobalEvent(eventName, methodName);
        });
      }

      //subscribe all DOM events !

      if (this.events !== undefined) {
        this.on(this.events);
      }

      //Calling the global preStart function !
      if (typeof pitana.settings.preStart === "function") {
        pitana.settings.preStart.call(this);
      }
      //TODO - You can find all submodule from DOM and load subView

    },
    _getEventBus: function() {
      return this._viewMetadata.eventBus;
    },
    subscribeGlobalEvent: function(topic, methodName) {
      var self = this;
      var callback = function() {
        self[methodName].apply(self, arguments);
      };
      if (this._viewMetadata.topicList[topic] === undefined) {
        this._viewMetadata.topicList[topic] = [];
      }
      var bus = this._getEventBus();
      this._viewMetadata.topicList[topic].push(bus.subscribe(topic, callback));
    },
    unsubscribeGlobalEvent: function(topic) {
      var bus = this._getEventBus();
      if (this._viewMetadata.topicList[topic] !== undefined) {
        this._viewMetadata.topicList[topic].map(function(v, i) {
          bus.unsubscribe(v);
        });
        delete this._viewMetadata.topicList[topic];
      }
    },
    publishGlobalEvent: function(topic) {
      var bus = this._getEventBus();
      bus.publish.apply(bus, arguments);
    },
    on: function(obj) {
      //We use {"eventName hash":"handler"} kind of notation !
      var self = this;
      pitana.util.for(obj, function(methodName, key) {
        key = key.trim().replace(/ +/g, " ");
        var arr = key.split(" ");
        var eventName = arr.shift();
        var hash = arr.join(" ");
        var callback = pitana.domEvents.addLiveEventListener(self.$, eventName, hash, self[methodName], self);
        self._viewMetadata.eventsMap[key] = {
          eventName: eventName,
          callback: callback
        };
      });
    },
    off: function(key) {
      //Unsubscribe dom event
      var v = this._viewMetadata.eventsMap[key];
      if (v !== undefined && typeof v === "object") {
        this.$.removeEventListener(v.eventName, v.callback);
        delete this._viewMetadata.eventsMap[key];
      }
    },
    trigger: function(eventName) {
      //Default Trigger will be on this.$ which is our custom event.
      pitana.domEvents.trigger(this.$, eventName);
    },
    _endModule: function() {

      //call postEnd();
      if (typeof pitana.settings.postEnd === "function") {
        pitana.settings.postEnd.call(this);
      }

      //unSubscribing All DOM events
      var self = this;
      pitana.util.for(this._viewMetadata.eventsMap, function(v, key) {
        self.off(key);
      });

      //Remove all HTML inside this.$
      this.$.innerHTML = "";

      //unSubscribe All globalEvents
      pitana.util.for(this._viewMetadata.topicList, function(v, topic) {
        self.unsubscribeGlobalEvent(topic);
      });
    }

  });
})();
;/**
 * Created by narendra on 15/3/15.
 */

(function() {
  "use strict";
  pitana.ObjectMap = pitana.Base.extend({
    initialize: function() {
      pitana.Base.apply(this, arguments);
      this.allNodes = [];
    },
    add: function(obj, val) {
      var n = obj.__ELEMENT_TO_VIEW_INDEX__;
      if (n === undefined) {
        this.allNodes.push({
          obj: obj,
          val: val
        });
        obj.__ELEMENT_TO_VIEW_INDEX__ = this.allNodes.length - 1;
      } else {
        throw "Week map Error, object already mapped";
      }
    },
    get: function(obj) {
      var index = obj.__ELEMENT_TO_VIEW_INDEX__;
      if (index !== undefined) {
        return this.allNodes[index].val;
      }
    },
    set: function(obj, val) {
      var index = obj.__ELEMENT_TO_VIEW_INDEX__;
      if (index !== undefined) {
        this.allNodes[index].val = val;
      }
    },
    remove: function(obj) {
      var index = obj.__ELEMENT_TO_VIEW_INDEX__;
      if (index !== undefined) {
        this.allNodes[index] = null;
        delete obj.__ELEMENT_TO_VIEW_INDEX__;
      }
    }
  });

})();
;/**
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
;/**
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

    if (ViewConstructor.prototype.accessors !== undefined) {
      pitana.util.for(ViewConstructor.prototype.accessors, function(attrObj, attrName) {
        var Prop = {};
        Prop[attrName] = {
          get: function() {
            if (pitana.accessorType[attrObj.type] !== undefined) {
              return pitana.accessorType[attrObj.type].get.call(this, attrName, attrObj);
            } else {
              return this.getAttribute(attrName);
            }
          },
          set: function(newVal) {
            if (pitana.accessorType[attrObj.type] !== undefined) {
              pitana.accessorType[attrObj.type].set.call(this, attrName, newVal, attrObj);
            } else {
              this.setAttribute(attrName, newVal);
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
