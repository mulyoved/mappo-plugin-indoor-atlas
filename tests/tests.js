﻿/*
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

exports.defineAutoTests = function () {
    var isWindows = (cordova.platformId === "windows") || (cordova.platformId === "windows8"),
     // Checking existence of indooratlas for windows platform
     // Assumed that indooratlas always exists on other platforms. Extend
     // condition to support indooratlas check on other platforms
     isAccelExist = isWindows ? Windows.Devices.Sensors.IndoorAtlas.getDefault() !== null : true;

  describe('IndoorAtlas (navigator.indooratlas)', function () {
    var fail = function(done) {
      expect(true).toBe(false);
      done();
    };

    it("indooratlas.spec.1 should exist", function () {
      expect(navigator.indooratlas).toBeDefined();
    });

    describe("getCurrentNavPosition", function() {
      it("indooratlas.spec.2 should exist", function() {
        expect(typeof navigator.indooratlas.getCurrentNavPosition).toBeDefined();
        expect(typeof navigator.indooratlas.getCurrentNavPosition == 'function').toBe(true);
      });

      it("indooratlas.spec.3 success callback should be called with an NavPosition object", function(done) {
        // skip the test if IndoorAtlas doesn't exist on this device
        if (!isAccelExist) {
          pending();
        }
        var win = function(a) {
          expect(a).toBeDefined();
          expect(a.x).toBeDefined();
          expect(typeof a.x == 'number').toBe(true);
          expect(a.y).toBeDefined();
          expect(typeof a.y == 'number').toBe(true);
          expect(a.z).toBeDefined();
          expect(typeof a.z == 'number').toBe(true);
          expect(a.timestamp).toBeDefined();
          expect(typeof a.timestamp).toBe('number');
          done();
        };

        navigator.indooratlas.getCurrentNavPosition(win, fail.bind(null, done));
      });

      it("indooratlas.spec.4 success callback NavPosition object should have (reasonable) values for x, y and z expressed in m/s^2", function(done) {
        // skip the test if IndoorAtlas doesn't exist on this device
        if (!isAccelExist) {
          pending();
        }
        var reasonableThreshold = 15;
        var win = function(a) {
          expect(a.x).toBeLessThan(reasonableThreshold);
          expect(a.x).toBeGreaterThan(reasonableThreshold * -1);
          expect(a.y).toBeLessThan(reasonableThreshold);
          expect(a.y).toBeGreaterThan(reasonableThreshold * -1);
          expect(a.z).toBeLessThan(reasonableThreshold);
          expect(a.z).toBeGreaterThan(reasonableThreshold * -1);
          done()
        };

        navigator.indooratlas.getCurrentNavPosition(win, fail.bind(null,done));
      });

      it("indooratlas.spec.5 success callback NavPosition object should return a recent timestamp", function(done) {
        // skip the test if IndoorAtlas doesn't exist on this device
        if (!isAccelExist) {
          pending();
        }
        var veryRecently = (new Date()).getTime();
        // Need to check that dates returned are not vastly greater than a recent time stamp.
        // In case the timestamps returned are ridiculously high
        var reasonableTimeLimit = veryRecently + 5000; // 5 seconds from now
        var win = function(a) {
          expect(a.timestamp).toBeGreaterThan(veryRecently);
          expect(a.timestamp).toBeLessThan(reasonableTimeLimit);
          done();
        };

        navigator.indooratlas.getCurrentNavPosition(win, fail.bind(null,done));
      });
    });

    describe("watchNavPosition", function() {
      var id;

      afterEach(function() {
          navigator.indooratlas.clearWatch(id);
      });

      it("indooratlas.spec.6 should exist", function() {
          expect(navigator.indooratlas.watchNavPosition).toBeDefined();
          expect(typeof navigator.indooratlas.watchNavPosition == 'function').toBe(true);
      });

      it("indooratlas.spec.7 success callback should be called with an NavPosition object", function(done) {
        // skip the test if IndoorAtlas doesn't exist on this device
        if (!isAccelExist) {
          pending();
        }
        var win = function(a) {
          expect(a).toBeDefined();
          expect(a.x).toBeDefined();
          expect(typeof a.x == 'number').toBe(true);
          expect(a.y).toBeDefined();
          expect(typeof a.y == 'number').toBe(true);
          expect(a.z).toBeDefined();
          expect(typeof a.z == 'number').toBe(true);
          expect(a.timestamp).toBeDefined();
          expect(typeof a.timestamp).toBe('number');
          done();
        };

        id = navigator.indooratlas.watchNavPosition(win, fail.bind(null,done), {frequency:100});
      });

        it("indooratlas.spec.8 success callback NavPosition object should have (reasonable) values for x, y and z expressed in m/s^2", function(done) {
          // skip the test if IndoorAtlas doesn't exist on this device
          if (!isAccelExist) {
            pending();
          }
          var reasonableThreshold = 15;
          var win = function(a) {
            expect(a.x).toBeLessThan(reasonableThreshold);
            expect(a.x).toBeGreaterThan(reasonableThreshold * -1);
            expect(a.y).toBeLessThan(reasonableThreshold);
            expect(a.y).toBeGreaterThan(reasonableThreshold * -1);
            expect(a.z).toBeLessThan(reasonableThreshold);
            expect(a.z).toBeGreaterThan(reasonableThreshold * -1);
            done();
          };

          id = navigator.indooratlas.watchNavPosition(win, fail.bind(null,done), {frequency:100});
        });

        it("indooratlas.spec.9 success callback NavPosition object should return a recent timestamp", function(done) {
          // skip the test if IndoorAtlas doesn't exist on this device
          if (!isAccelExist) {
            pending();
          }
          var veryRecently = (new Date()).getTime();
          // Need to check that dates returned are not vastly greater than a recent time stamp.
          // In case the timestamps returned are ridiculously high
          var reasonableTimeLimit = veryRecently + 5000; // 5 seconds from now
          var win = function(a) {
            expect(a.timestamp).toBeGreaterThan(veryRecently);
            expect(a.timestamp).toBeLessThan(reasonableTimeLimit);
            done();
          };

          id = navigator.indooratlas.watchNavPosition(win, fail.bind(null,done), {frequency:100});
        });

        it("indooratlas.spec.12 success callback should be preserved and called several times", function (done) {
            // skip the test if IndoorAtlas doesn't exist on this device
            if (!isAccelExist) {
              pending();
            }
            var callbacksCallCount = 0,
                callbacksCallTestCount = 3;

            var win = function (a) {
                if (callbacksCallCount++ < callbacksCallTestCount) return;
                expect(typeof a).toBe('object');
                done();
            };

            id = navigator.indooratlas.watchNavPosition(win, fail.bind(null, done), { frequency: 100 });
        });
    });

    describe("clearWatch", function() {
      it("indooratlas.spec.10 should exist", function() {
          expect(navigator.indooratlas.clearWatch).toBeDefined();
          expect(typeof navigator.indooratlas.clearWatch == 'function').toBe(true);
      });

      it("indooratlas.spec.11 should clear an existing watch", function(done) {
          // skip the test if IndoorAtlas doesn't exist on this device
          if (!isAccelExist) {
              pending();
          }
          var id;

          // expect win to get called exactly once
          var win = function(a) {
            // clear watch on first call
            navigator.indooratlas.clearWatch(id);
            // if win isn't called again in 201 ms we assume success
            var tid = setTimeout(function() {
              expect(true).toBe(true);
              done();
            }, 101);
            // if win is called again, clear the timeout and fail the test
            win = function() {
              clearTimeout(tid);
              fail(done);
            }
          };

          // wrap the success call in a closure since the value of win changes between calls
          id = navigator.indooratlas.watchNavPosition(function() { win(); }, fail.bind(null, done), {frequency:100});
      });
    });
  });
};

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

exports.defineManualTests = function (contentEl, createActionButton) {
    function roundNumber(num) {
        var dec = 3;
        var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
        return result;
    }

    var watchAccelId = null;

    /**
     * Start watching acceleration
     */
    var watchAccel = function () {
        console.log("watchAccel()");

        // Success callback
        var success = function (a) {
          console.log("success");
          if (document.getElementById('roundtrip')) {
            document.getElementById('roundtrip').innderHTML = roundNumber(a.roundtrip);
            document.getElementById('lat').innderHTML = roundNumber(a.lat);
            document.getElementById('lon').innderHTML = roundNumber(a.lon);
            document.getElementById('timestamp').innderHTML = a.timestamp;
            document.getElementById('x').innderHTML = roundNumber(a.x);
            document.getElementById('y').innderHTML = roundNumber(a.y);
            document.getElementById('i').innderHTML = a.i;
            document.getElementById('j').innderHTML = a.j;
            document.getElementById('heading').innderHTML = roundNumber(a.heading);
            document.getElementById('uncertainty').innderHTML = roundNumber(a.uncertainty);
            document.getElementById('calibration-state').innderHTML = a.calibrationState;
            document.getElementById('calibration').innderHTML = roundNumber(a.calibration);
          }
        };

        // Fail callback
        var fail = function (e) {
            console.log("watchAccel fail callback with error code " + e);
            stopAccel();
            setAccelStatus(IndoorAtlas.ERROR_MSG[e]);
        };

        // Update acceleration every 1 sec
        var opt = {};
        opt.frequency = 1000;
        watchAccelId = navigator.indooratlas.watchNavPosition(success, fail, opt);

        setAccelStatus("Running");
    };

    /**
     * Stop watching the acceleration
     */
    var stopAccel = function () {
        console.log("stopAccel()");
        setAccelStatus("Stopped");
        if (watchAccelId) {
            navigator.indooratlas.clearWatch(watchAccelId);
            watchAccelId = null;
        }
    };

    /**
     * Get current acceleration
     */
    var getAccel = function () {
        console.log("getAccel()");

        // Stop accel if running
        stopAccel();

        // Success callback
        var success = function (a) {
          if (document.getElementById('roundtrip')) {
            document.getElementById('roundtrip').innderHTML = roundNumber(a.roundtrip);
            document.getElementById('lat').innderHTML = roundNumber(a.lat);
            document.getElementById('lon').innderHTML = roundNumber(a.lon);
            document.getElementById('timestamp').innderHTML = a.timestamp;
            document.getElementById('x').innderHTML = roundNumber(a.x);
            document.getElementById('y').innderHTML = roundNumber(a.y);
            document.getElementById('i').innderHTML = a.i;
            document.getElementById('j').innderHTML = a.j;
            document.getElementById('heading').innderHTML = roundNumber(a.heading);
            document.getElementById('uncertainty').innderHTML = roundNumber(a.uncertainty);
            document.getElementById('calibration-state').innderHTML = a.calibrationState;
            document.getElementById('calibration').innderHTML = roundNumber(a.calibration);
            console.log("getAccel success callback");
          }
        };

        // Fail callback
        var fail = function (e) {
            console.log("getAccel fail callback with error code " + e);
            setAccelStatus(IndoorAtlas.ERROR_MSG[e]);
        };

        // Make call
        var opt = {};
        navigator.indooratlas.getCurrentNavPosition(success, fail, opt);
    };

    /**
     * Set indooratlas status
     */
    var setAccelStatus = function (status) {
        document.getElementById('indooratlas_status').innerHTML = status;
    };

    /******************************************************************************/

    var indooratlas_tests = '<div id="getNavPosition"></div>' +
        '(version 1.0) Expected result: Will update the status box with X and Y values when pressed. Status will read "Stopped"' +
        '<p/> <div id="watchNavPosition"></div>' +
        'Expected result: When pressed, will start a watch on the indooratlas and update X,Y values when movement is sensed. Status will read "Running"' +
        '<p/> <div id="clearNavPosition"></div>' +
        'Expected result: Will clear the indooratlas watch, so X,Y,Z values will no longer be updated. Status will read "Stopped"';

    contentEl.innerHTML = '<div id="indoor_atlas_info">' +
        'Status: <span id="indooratlas_status">Stopped</span>' +
        '<table width="100%">' +
        '<tr><td width="20%">roundtrip:</td><td id="roundtrip"> </td></tr>' +
        '<tr><td width="20%">lat:</td><td id="lat"> </td></tr>' +
        '<tr><td width="20%">lon:</td><td id="lon"> </td></tr>' +
        '<tr><td width="20%">timestamp:</td><td id="timestamp"> </td></tr>' +
        '<tr><td width="20%">x:</td><td id="x"> </td></tr>' +
        '<tr><td width="20%">y:</td><td id="y"> </td></tr>' +
        '<tr><td width="20%">i:</td><td id="i"> </td></tr>' +
        '<tr><td width="20%">j:</td><td id="j"> </td></tr>' +
        '<tr><td width="20%">heading:</td><td id="heading"> </td></tr>' +
        '<tr><td width="20%">uncertainty:</td><td id="uncertainty"> </td></tr>' +
        '<tr><td width="20%">calibrationState:</td><td id="calibration-state"> </td></tr>' +
        '<tr><td width="20%">calibration:</td><td id="calibration"> </td></tr>' +
        '</table></div>' +
    indooratlas_tests;

    createActionButton('Get NavPosition', function () {
        getAccel();
    }, 'getNavPosition');

    createActionButton('Start Watch', function () {
        watchAccel();
    }, 'watchNavPosition');

    createActionButton('Clear Watch', function () {
        stopAccel();
    }, 'clearNavPosition');
};
