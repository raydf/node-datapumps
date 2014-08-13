(function() {
  var Buffer, EventEmitter, Group, Promise, Pump,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  Promise = require('bluebird');

  Pump = require('./Pump');

  Buffer = require('./Buffer');

  Group = (function(_super) {
    __extends(Group, _super);

    Group.STOPPED = 0;

    Group.STARTED = 1;

    Group.ENDED = 2;

    function Group() {
      this._pumps = {};
      this._exposedBuffers = {};
      this._state = Group.STOPPED;
    }

    Group.prototype.addPump = function(name, pump) {
      if (pump == null) {
        pump = null;
      }
      if (this._pumps[name] != null) {
        throw new Error('Pump already exists');
      }
      this._pumps[name] = pump != null ? pump : new Pump;
      this._pumps[name].on('end', (function(_this) {
        return function() {
          return _this.pumpEnded(name);
        };
      })(this));
      return this._pumps[name];
    };

    Group.prototype.pumpEnded = function(name) {
      var end, pump, _ref;
      end = true;
      _ref = this._pumps;
      for (name in _ref) {
        pump = _ref[name];
        if (!pump.isEnded()) {
          end = false;
        }
      }
      if (!end) {
        return;
      }
      this._state = Group.ENDED;
      return this.emit('end');
    };

    Group.prototype.pump = function(name) {
      if (this._pumps[name] == null) {
        throw new Error("Pump " + name + " does not exist");
      }
      return this._pumps[name];
    };

    Group.prototype.start = function() {
      var name, pump, _ref;
      if (this._state !== Group.STOPPED) {
        throw new Error('Group already started');
      }
      this._state = Group.STARTED;
      _ref = this._pumps;
      for (name in _ref) {
        pump = _ref[name];
        pump.start();
      }
      return this;
    };

    Group.prototype.isEnded = function() {
      return this._state === Group.ENDED;
    };

    Group.prototype.whenFinished = function() {
      return new Promise((function(_this) {
        return function(resolve) {
          return _this.on('end', function() {
            return resolve();
          });
        };
      })(this));
    };

    Group.prototype.createBuffer = function(options) {
      if (options == null) {
        options = {};
      }
      return new Buffer(options);
    };

    Group.prototype.expose = function(exposedName, bufferPath) {
      if (this._exposedBuffers[exposedName] != null) {
        throw new Error('Already exposed a buffer with that name');
      }
      return this._exposedBuffers[exposedName] = this._getBufferByPath(bufferPath);
    };

    Group.prototype._getBufferByPath = function(bufferPath) {
      var bufferName, items, pumpName;
      items = bufferPath.split('/');
      if (items.length > 2) {
        throw new Error('bufferPath format must be <pumpName>/<bufferName>');
      }
      pumpName = items[0], bufferName = items[1];
      return this.pump(pumpName).buffer(bufferName != null ? bufferName : 'output');
    };

    Group.prototype.buffer = function(name) {
      if (name == null) {
        name = 'output';
      }
      if (!this._exposedBuffers[name]) {
        throw new Error("No such buffer: " + name);
      }
      return this._exposedBuffers[name];
    };

    return Group;

  })(EventEmitter);

  module.exports = Group;

}).call(this);