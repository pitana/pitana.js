(function() {
  "use strict";

  pitana.settings.GlobalEventBus = new pitana.EventBus();

  pitana.HTMLElement = pitana.Base.extend({
    initialize: function(data) {
      pitana.Base.apply(this, arguments);
      this.$ = data.ele;

      if (this.template instanceof HTMLTemplateElement) {
        this.$.appendChild(document.importNode(this.template.content, true));
      } else {
        //Loading Template !!
        //TODO -Support for underscore template
        if (this.template !== undefined && this.template !== null) {
          var str = "";
          if (typeof this.template === "string") {
            str = this.template;
          }
          if (typeof this.template === "function") {
            str = this.template();
          }
          this.$.innerHTML = pitana.settings.postTemplateProcessing(str);
        }
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
    trigger: function(eventName, detail) {
      //Default Trigger will be on this.$ which is our custom event.
      pitana.domEvents.trigger(this.$, eventName, detail);
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
      if(!this.preserveHTML){
        this.$.innerHTML = "";
      }

      //unSubscribe All globalEvents
      pitana.util.for(this._viewMetadata.topicList, function(v, topic) {
        self.unsubscribeGlobalEvent(topic);
      });
    }

  });
})();
