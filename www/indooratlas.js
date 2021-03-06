/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

/**
 * This class provides access to device indooratlas data.
 * @constructor
 */
var argscheck = require('cordova/argscheck'),
  utils = require("cordova/utils"),
  exec = require("cordova/exec"),
  NavPosition = require('./NavPosition');

// Is the accel sensor running?
var running = false;

// Keeps reference to watchNavPosition calls.
var timers = {};

// Array of listeners; used to keep track of when we should call start and stop.
var listeners = [];

// Last returned acceleration object from native
var accel = null;

var floorPlanId = null;

// Tells native to start.
function start(options) {
  console.log('indoortlas start');
  floorPlanId = options.floorPlanId;
  exec(function (a) {
    console.log('result from indooratlas callback', a);
    var tempListeners = listeners.slice(0);
    accel = new NavPosition(a.x, a.y, a.timestamp, a.i, a.j, a.roundtrip, a.lat, a.lon, a.heading, a.uncertainty, a.calibrationState, a.calibration);
    for (var i = 0, l = tempListeners.length; i < l; i++) {
      tempListeners[i].win(accel);
    }
  }, function (e) {
    console.log('error from indooratlas callback', e);
    var tempListeners = listeners.slice(0);
    for (var i = 0, l = tempListeners.length; i < l; i++) {
      tempListeners[i].fail(e);
    }
  }, "IndoorAtlas", "start", [options.venueId, options.floorId, options.floorPlanId]);
  running = true;
}

// Tells native to stop.
function stop() {
  console.log('indoortlas stop');
  exec(null, null, "IndoorAtlas", "stop", []);
  running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
  return {win: win, fail: fail};
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
  console.log('removeListeners', l);
  var idx = listeners.indexOf(l);
  if (idx > -1) {
    console.log('removeListeners found - remove');
    listeners.splice(idx, 1);
    if (listeners.length === 0) {
      console.log('no more listners, stop indooratlas');
      stop();
    }
    else {
      console.log('still listners', listeners.length);
    }
  }
}

var indooratlas = {
  /**
   * Asynchronously acquires the current acceleration.
   *
   * @param {Function} successCallback    The function to call when the acceleration data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
   * @param {NavPositionOptions} options The options for getting the indooratlas data such as timeout. (OPTIONAL)
   */
  getCurrentNavPosition: function (successCallback, errorCallback, options) {
    argscheck.checkArgs('fFO', 'indooratlas.getCurrentNavPosition', arguments);

    var p;
    var win = function (a) {
      removeListeners(p);
      successCallback(a);
    };
    var fail = function (e) {
      removeListeners(p);
      errorCallback && errorCallback(e);
    };

    p = createCallbackPair(win, fail);
    listeners.push(p);

    if (!running) {
      start(options);
    }
  },

  /**
   * Asynchronously acquires the acceleration repeatedly at a given interval.
   *
   * @param {Function} successCallback    The function to call each time the acceleration data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
   * @param {NavPositionOptions} options The options for getting the indooratlas data such as timeout. (OPTIONAL)
   * @return String                       The watch id that must be passed to #clearWatch to stop watching.
   */
  watchNavPosition: function (successCallback, errorCallback, options) {
    argscheck.checkArgs('fFO', 'indooratlas.watchNavPosition', arguments);

    var id = utils.createUUID();
    console.log('watchNavPosition', id, arguments);

    var p;
    var win = function(a) {
      successCallback(a);
    };
    var fail = function (e) {
      removeListeners(p);
      errorCallback && errorCallback(e);
    };

    p = createCallbackPair(win, fail);
    listeners.push(p);

    timers[id] = {
      listeners: p
    };

    if (floorPlanId !== options.floorPlanId) {
      console.log('floor plan changed, stop service');
      stop();
    }

    if (running) {
      console.log('already running');
      // If we're already running then immediately invoke the success callback
      // but only if we have retrieved a value, sample code does not check for null ...
      if (accel) {
        successCallback(accel);
      }
    } else {
      start(options);
    }

    return id;
  },

  /**
   * Clears the specified indooratlas watch.
   *
   * @param {String} id       The id of the watch returned from #watchNavPosition.
   */
  clearWatch: function (id) {
    console.log('clearWatch', id);
    // Stop javascript timer & remove from timer list
    if (id && timers[id]) {
      removeListeners(timers[id].listeners);
      delete timers[id];
    }
  }
};
module.exports = indooratlas;
