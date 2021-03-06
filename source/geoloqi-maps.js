if (!geoloqi) {
  var geoloqi = {};
}

geoloqi.maps = (function () {

  //Public Facing Object
  var exports = {},
    util = {};

  util.merge = function (obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
  };

  //Sets the default map everything should reference
  exports.setDefault = function (newMap) {
    if (newMap instanceof google.maps.Map) {
      defaults.map = newMap;
      defaults.pin.map = newMap;
      defaults.line.map = newMap;
      defaults.handle.map = newMap;
    }
  };

  exports.getMap = function () {
    return defaults.map;
  };

  //Public Methods for Styles
  exports.styles = {};

  //Add a style that can be reused later
  exports.styles.define = function (name, style, makeDefault) {
    makeDefault = (typeof makeDefault !== "undefined") ? makeDefault : false;

    exports.styles[name] = util.merge(exports.styles['_default'], style);

    if (makeDefault) {
      exports.styles.setDefault(name);
    }
  };

  //Set a new default style
  exports.styles.setDefault = function (name) {
    exports.styles._default = exports.styles[name];
  };

  exports.styles._default = {
    marker: {},
    circles: {
      count: 1,
      fillColor: "#CE7F2C",
      fillOpacity: 0.2,
      strokeColor: "#CE7F2C",
      strokeWeight: 2,
      strokeOpacity: 0.6
    },
    handle: {},
    line: {
      strokeColor: "#000",
      strokeWeight: 2,
      strokeOpacity: 0.6
    },
    info: {
      useInfobox: false
    }
  };

  exports.styles.geoloqi_js = exports.styles._default;

  var defaults = {
    map: null,
    pin: {
      style: '_default',
      map: null,
      visible: true,
      clickable: false,
      draggable: true,
      editable: true,
      radius: 100,
      minRadius:100,
      autopan: false,
      toggleInfobox: false
    },
    line: {
      clickable: false,
      map: null
    },
    handle: {
      icon: exports.styles['_default'].handle.icon,
      shadow: exports.styles['_default'].handle.shadow,
      map: null,
      draggable: true,
      raiseOnDrag: false,
      clickable: false,
      visible: true
    },
    info: {
      useInfobox: false,
      opened: false,
      toggleInfoOnClick: true,
      openAfterDrag: true
    },
    events : {
      dragstart : null,
      dragend : null,
      drag : null,
      open : null,
      close : null,
      lock : null,
      unlock : null,
      radius_changed : null,
      position_changed: null,
      map_changed: null,
      create : null,
      show : null,
      hide : null,
      click : null
    }
  };

  //Public Helper Methods 
  exports.helpers = {};

  //Zoom and center map to a radius
  exports.helpers.fitMapToRadius = function (center, radius) {
    bounds = new google.maps.LatLngBounds();
    var geo = google.maps.geometry.spherical;
    bounds.extend(geo.computeOffset(center, radius, 0));
    bounds.extend(geo.computeOffset(center, radius, 180));
    bounds.extend(geo.computeOffset(center, radius, 270));
    bounds.extend(geo.computeOffset(center, radius, 90));
    defaults.map.fitBounds(bounds);
  };

  //Returns the ideal radius for a map
  exports.helpers.getIdealRadiusForMap = function (fillPercent) {
    fraction = (typeof fillPercent !== 'undefined') ? 100 / fillPercent : 4;
    var bounds = exports.getMap().getBounds(),
    ne = bounds.getNorthEast(),
    sw = bounds.getSouthWest(),
    se = new google.maps.LatLng(sw.lat(), ne.lng());
    return (google.maps.geometry.spherical.computeDistanceBetween(ne, se) / fraction);
  };

  //Namespace for pins
  exports.pins = {};

  //Basic Pin
  exports.pins.Basic = function (opts, init) {

    init = (typeof init !== "undefined") ? init : true; //Turn on prototypes

    var object = function () {

      this.options = util.merge(defaults.pin, opts);
      this.style = exports.styles[this.options.style];
      
      this.options.icon = this.style.marker.icon;
      this.options.shadow = this.style.marker.shadow;

      if (this.options.position instanceof google.maps.LatLng === false) {
        this.options.position = new google.maps.LatLng(this.options.position.latitude, this.options.position.longitude);
      }

      if (this.options.editable) {
        opts.draggable = true;
      } else {
        opts.draggable = false;
      }
      
      this.isVisible = (typeof this.options.map === "object") ? true : false;

      this.events = util.merge(defaults.events, opts.events);

      if(init){
        this.initPin();
      }
    };

    object.prototype = {

      centerHere: function(){
        mapToPan = this.getMap();
        mapToPan.panTo(this.getPosition());
        return this;
      },

      onMap: function(){
        if(typeof this.getMap() === "object"){
          return true;
        } else {
          return false;
        }
      },

      showOnMap: function(targetMap){
        targetMap = (targetMap) ? targetMap : defaults.map;
        this.marker.setVisible(true);
        this.marker.setMap(targetMap);
        google.maps.event.trigger(this.marker, "show");
        return this;
      },

      removeFromMap: function() {
        this.marker.setMap(null);
        google.maps.event.trigger(this.marker, "hide");
        return this;
      },

      setDraggable: function(state){
        this.marker.setDraggable(state);
        return this;
      },

      getDraggable: function() {
        return this.marker.getDraggable();
      },

      toggleDraggable: function(){
        if(this.getDraggable()){
          this.setDraggable(false);
        } else {
          this.setDraggable(true);
        }
        return this;
      },

      getMap: function(){
        return this.marker.getMap();
      },

      moveTo: function(position, autopan){
        autopan = (typeof autopan !== "undefined") ?  autopan : false;
        
        if(position instanceof google.maps.LatLng === false){
          position = new google.maps.LatLng(position.latitude, position.longitude);
        }
        
        this.setPosition(position);

        if(autopan){
          this.centerHere();
        }

        return this;
      },

      setPosition: function(position){
        if(position instanceof google.maps.LatLng === false){
          position = new google.maps.LatLng(position.latitude, position.longitude);
        }

        this.marker.setPosition(position);
        return this;
      },

      getPosition: function(){
        return this.marker.getPosition();
      },

      getLat: function(){
        return this.getPosition().lat();
      },

      getLng: function(){
        return this.getPosition().lng();
      },

      setMap: function(map){
        this.marker.setMap(map);
        google.maps.event.trigger(this.marker, "map_changed");
        return this;
      },

      initPin: function() {
        var self = this;
        this.marker = new google.maps.Marker(this.options);

        google.maps.event.addListener(this.marker, "dragstart", function(event){
          (self.events.dragstart) ? self.events.dragstart.apply(self, [event]) : null;
        });

        google.maps.event.addListener(this.marker, "drag", function(event){
          (self.events.drag) ? self.events.drag.apply(self, [event]) : null;
        });

        google.maps.event.addListener(this.marker, "dragend", function(event) {
          if(self.options.autopan){
            self.getMap().panTo(self.getPosition());
          }
          (self.events.dragend) ? self.events.dragend.apply(self, [event]) : null;
        });

        google.maps.event.addListener(this.marker, "position_changed", function(event){
          (self.events.position_changed) ? self.events.position_changed.apply(self, [event]) : null;
        });

        google.maps.event.addListener(this.marker, "map_changed", function(event){
          (self.events.map_changed) ? self.events.map_changed.apply(self) : null;
        });

        google.maps.event.addListener(this.marker, "click", function(event){
          (self.events.click) ? self.events.click.apply(self, [event]) : null;
        });

        (this.events.create) ? this.events.create() : null;

      }

    };

    return new object();
  };

  //A Pin With A Radius
  exports.pins.WithRadius = function(opts, init, inherit) {

    inherit = (typeof inherit !== "undefined") ? inherit : true; //Turn on prototypes
    init = (typeof init !== "undefined") ? init : true; //Turn on prototypes

    var object = function(){

      // Properties
      // ==========
      this.options = util.merge(defaults.pin, opts);
      this.style = exports.styles[this.options.style];
      
      this.handleOptions = util.merge(defaults.handle, this.style.handle);
      this.handleOptions.position = new google.maps.LatLng(0,0);
      this.handleOptions.map = this.options.map;

      this.lineOptions = util.merge(defaults.line, this.style.line);
      this.lineOptions.map = this.options.map;

      this.minRadius = this.options.minRadius;

      // Methods
      // =======
      this.hideCircles = function(){
        if(this.circles.length > 0){
          for(var i = 0; i<this.circles.length; i++) {
            this.circles[i].circle.setMap(null);
          }
        }
        return this;
      };

      this.showCircles = function(){
        if(this.circles.length > 0){
          for(var i = 0; i<this.circles.length; i++) {
            this.circles[i].circle.setMap(this.getMap());
          }
        }
        return this;
      };

      this.getRadius = function(){
        return this.circles[0].circle.getRadius();
      };

      // Setup Circles
      this.setupCircles = function(radius, showOnMap){
        var self = this;
        radius = (radius) ? radius : this.radius;
        radius = Math.max(self.minRadius, radius);
        showOnMap = (typeof showOnMap !== "undefined") ?  showOnMap : this.onMap();

        this.hideCircles();

        this.circles = [];
        
        for(var i = 0; i<this.style.circles.count; i++) {
          this.circles.push({
            circle: new google.maps.Circle({
              center: this.getPosition(),
              radius: radius - (i*3),
              fillColor: this.style.circles.fillColor,
              fillOpacity: this.style.circles.fillOpacity,
              strokeColor: this.style.circles.strokeColor,
              strokeWeight: this.style.circles.strokeWeight,
              strokeOpacity: this.style.circles.strokeOpacity,
              map: (showOnMap) ? this.getMap() : null,
              zIndex: -1
            }),
            index: i
          });
          this.circles[i].circle.bindTo('center', this.marker, 'position');
        }
        
        google.maps.event.trigger(this.marker, "radius_changed");
        
        this.updateHandle();
        this.updateLine();
        
        return this;
      };

      this.updateHandle = function(){
        this.handle.setPosition(google.maps.geometry.spherical.computeOffset(this.marker.getPosition(), this.getRadius(), 135));
        return this;
      };

      this.updateLine = function(){
        this.line.setPath([this.getPosition(), this.handle.getPosition()]);
        return this;
      };

      this.hideHandle = function() {
        this.line.setMap(null);
        this.handle.setMap(null);
        return this;
      };

      this.fitCircles = function(fillPercent){
        fillPercent = (fillPercent) ? fillPercent : 50;
        this.setupCircles(exports.helpers.getIdealRadiusForMap(fillPercent));
        return this;
      };

      this.showHandle = function() {
        this.updateHandle();
        this.updateLine();
        this.line.setMap(this.getMap());
        this.handle.setMap(this.getMap());
        return this;
      };

      this.fitCircles = function(){
        this.setupCircles(exports.helpers.getIdealRadiusForMap());
        return this;
      }

      this.lockPin = function(){
        if(!this.isLocked){
          this.setDraggable(false);
          this.isLocked = true;
          this.hideHandle();
          google.maps.event.trigger(this.marker, "locked");
        }
        return this;
      };

      this.unlockPin = function() {
        if(this.isLocked){
          this.marker.setDraggable(true);
          this.isLocked = false;
          if(this.getMap()){
            this.showHandle();
          }
          google.maps.event.trigger(this.marker, "unlocked");
        }
        return this;
      };

      this.toggleLock = function() {
        if(this.isLocked){
          this.unlockPin();
        } else {
          this.lockPin();
        }
        return this;
      };

      this.initRadius = function(){
        var self = this;
        this.line = new google.maps.Polyline(this.lineOptions);
        this.handle = new google.maps.Marker(this.handleOptions);
        this.circles = [];

        this.options.draggable = this.options.editable;

        if(this.options.editable){
          this.unlockPin();
        } else {
          this.lockPin();
        }

        //Setup Circles
        this.setupCircles(this.options.radius, this.options.map);

        //Setup The Handle Position and Line
        this.updateHandle();
        this.updateLine();

        google.maps.event.addListener(this.marker, "hide", function(event) {
          self.hideHandle();
          self.hideCircles();  
        });

        google.maps.event.addListener(this.marker, "map_changed", function(event) {
          if(!self.isLocked){
            self.showHandle();
          }
          for(var i = 0; i<=self.circles.length-1; i++) {
            self.circles[i].circle.setMap(self.getMap());
          };
        });

        google.maps.event.addListener(this.marker, "show", function(event) {
          if(!self.isLocked){
            self.showHandle();
          }
          self.showCircles();  
        });

        //Update the handle and line when the marker is moved
        google.maps.event.addListener(this.marker, "position_changed", function(event) {
          self.updateHandle();
          self.updateLine();
        });

        // Update the position of the handle when the center is dragged
        google.maps.event.addListener(this.marker, "dragstart", function(event) {
          self.hideHandle();
        });

        google.maps.event.addListener(this.marker, "radius_changed", function(event){
          (self.events.radius_changed) ? self.events.radius_changed.apply(self) : null;
        });

        // Update the position of the handle when the center is dragged
        google.maps.event.addListener(this.marker, "dragend", function(event) {
          self.updateHandle();
          self.showHandle();
        });
        
        //Update Radius on handle drag
        google.maps.event.addListener(this.handle, "drag", function(event) {

          var G = google.maps.geometry.spherical;

          var A = self.getPosition();
          var B = event.latLng;

          var radians = function(degrees) { return degrees * (Math.PI/180); };

          // Compute the angle from A to B
          var beta = G.computeHeading(A, B);

          // The angle of the second triangle is 45 degrees plus the previous angle
          var gamma = 45 + beta;

          // The radius of the circle is cos(gamma) * distance from A to B
          var x = G.computeDistanceBetween(A, B);
          
          projectedRadius = -1 * (Math.cos(radians(gamma)) * x);
          
          newRadius = (projectedRadius >= self.minRadius) ? projectedRadius : self.minRadius;
          
          if(newRadius >= self.minRadius){
            self.handle.setPosition(G.computeOffset(A, newRadius, 135));
            self.updateLine();
                        
            for(var i = 0; i<self.style.circles.count; i++) {
              self.circles[i].circle.setRadius(newRadius - (i*3));
            }
          }


        });

        google.maps.event.addListener(this.handle, "dragend", function(event) {
          var bounds = defaults.map.getBounds();
          if(!bounds.contains(self.handle.getPosition())){
            exports.helpers.fitMapToRadius(self.marker.getPosition(), self.getRadius());
          }
          google.maps.event.trigger(self.marker, "radius_changed");
        });

      };

      // Init
      // ====
      (init) ? this.initRadius() : null;
    };

    (inherit) ? object.prototype = new exports.pins.Basic(opts) : '';

    return new object();
  };

  //A Pin With An Infobox
  exports.pins.WithInfobox = function(opts, init, inherit) {

    inherit = (typeof inherit !== "undefined") ? inherit : true; //Turn on prototypes
    init = (typeof init !== "undefined") ? init : true; //Turn on prototypes

    var object = function(){

      this.options = util.merge(defaults.pin, opts);
      this.style = exports.styles[this.options.style];
      this.infoOptions = util.merge(util.merge(defaults.info, this.style.info), opts);

      this.hide = function() {
        this.infoVisible = false;
        if(!this.options.content instanceof google.maps.InfoWindow){
          this.info.hide();
        } else {
          this.close();
        }
        return this;
      };

      this.show = function() {
        this.infoVisible = true;
        if(!this.options.content instanceof google.maps.InfoWindow){
          this.info.show(defaults.map, this.marker);
        } else {
          this.open();
        }
        return this;
      };

      this.open = function() {
        this.opened = true;
        this.infoVisible = true;
        this.delayedInfobox = true;
        this.info.open(defaults.map, this.marker);
        google.maps.event.trigger(this.marker, "open");
        return this;
      };

      this.close = function() {
        this.opened = false;
        this.infoVisible = false;
        this.info.close();
        google.maps.event.trigger(this.marker, "close");
        return this;
      };

      this.toggleInfo = function() {
        if(this.infoVisible) {
          this.hide();
        } else {
          this.show();
        }
        return this;
      };

      this.setContent = function(html) {
        this.info.setContent(html);
        return this;
      };

      this.getContent = function(html) {
        return this.info.getContent();
      };

      this.setInfo = function(obj, open){
        (typeof open !== 'undefined') ? open : false;
        (this.info) ? this.info.close() : null;
        this.info = obj;
        this.opened = open;

        if(open){
          this.info.open(defaults.map, this.marker);
        } else {
          this.close();
        }

        google.maps.event.addListener(this.info, 'close', function(){
          self.opened = false;
        });

        google.maps.event.addListener(this.info, 'closeclick', function(){
          self.opened = false;
        });

        return this;
      };

      this.initInfobox = function(){
        var self = this;

        this.opened = this.infoOptions.opened;
        this.infoOptions.position = null;

        if(typeof this.options.content === 'string'){
          if(this.infoOptions.useInfobox){
            this.setInfo(new InfoBox(this.infoOptions), this.opened);
          } else {
            this.setInfo(new google.maps.InfoWindow(this.infoOptions), this.opened);
          }
        } else if (this.options.content instanceof InfoBox || this.options.content instanceof google.maps.InfoWindow) {
          this.setInfo(this.options.content, this.opened);
        } else {
          this.info = null;
        }

        if(this.options.toggleInfoOnClick){
          this.isClickable = true;
          this.marker.setClickable(true);
          this.clickEvent = google.maps.event.addListener(this.marker, "click", function(event) {
            if(self.opened){
              self.close();
            } else {
              self.open();
            }
          });
        }

        this.delayedInfobox = false;
        
        google.maps.event.addListener(this.marker, "dragstart", function(event) {
          self.hide();
        });

        google.maps.event.addListener(this.marker, "dragend", function(event) {
          if(!self.infoVisible){
            self.show();
          }
        });

        google.maps.event.addListener(this.marker, "hide", function(event) {
          self.info.close();
        });

       google.maps.event.addListener(this.marker, "open", function(event){
          (self.events.open) ? self.events.open.apply(self, [event]) : null;
        });

        google.maps.event.addListener(this.marker, "close", function(event){
          (self.events.close) ? self.events.close.apply(self, [event]) : null;
        });
      };

      (init) ? this.initInfobox() : null;

    };

    (inherit) ? object.prototype = new exports.pins.Basic(opts) : null;

    return new object();
  };

  //A Pin With an Infobox and a Radius
  exports.pins.WithInfoboxAndRadius = function(opts, init, prototype) {

    prototype = (typeof prototype !== "undefined") ? prototype : true; //Turn on prototypes
    init = (typeof init !== "undefined") ? init : true; //Turn on prototypes

    var object = function() {

      this.initInfoboxAndRadius = function() {
        var self = this;

        google.maps.event.addListener(this.handle, "dragstart", function(event) {
          if(self.opened && self.options.openAfterDrag){
            self.close();
          }
        });

        google.maps.event.addListener(this.handle, "dragend", function(event) {
          if(!self.opened && self.options.openAfterDrag){
            self.open();
          }
        });

      };

      if(init){
        this.initRadius();
        this.initInfobox();
        this.initInfoboxAndRadius();
      }

    };

    object.prototype = util.merge(new exports.pins.WithRadius(opts, false, true), new exports.pins.WithInfobox(opts, false, false));

    return new object();
  };

  //Helper to generate styled info boxes
  exports.InfoBox = function(content, styleKey){
    style = (styleKey) ? exports.styles[styleKey] : exports.styles['_default'];
    options = util.merge(defaults.info, style.info);
    options.content = content;

    return new InfoBox(options);

  };

  return exports;

}());