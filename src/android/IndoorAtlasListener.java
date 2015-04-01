/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova.indooratlas;

import java.util.List;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.indooratlas.android.IndoorAtlas;
import com.indooratlas.android.IndoorAtlasException;
import com.indooratlas.android.IndoorAtlasFactory;
import com.indooratlas.android.CalibrationState;
//import com.indooratlas.android.IndoorAtlasListener;
import com.indooratlas.android.ServiceState;

/**
 * This class listens to the indooratlas sensor and stores the latest
 * acceleration values x,y,z.
 */
public class IndoorAtlasListener extends CordovaPlugin implements com.indooratlas.android.IndoorAtlasListener {

    public static String TAG = "IndoorAtlas";

    private String mApiKey = "ef07bc2d-dfb0-48b9-b190-03ccf91b1abb";
    private String mApiSecret = "LAcf0QZY0Jn%)i4R3BJ9UU)8UT%xaUU%ievg!s%1ABeMI0VEmIEQZQQKzadd1nu43Mzjvz8zHiUKybVnEG)MWxTrfbERS9V!O8DZkblC6qNttPGS6hrABIivZr4(pur)";

    private String mVenueId = "7de53ef8-0501-4a42-9d20-3124da54de36eue";
    private String mFloorId = "bd83ff0e-f673-4cd3-acd6-c982a2e16568";
    private String mFloorPlanId = "4ca7e9af-195a-431a-bc04-ca7f9c59b4e8";


    public static int STOPPED = 0;
    public static int STARTING = 1;
    public static int RUNNING = 2;
    public static int ERROR_FAILED_TO_START = 3;
   
    private double x,y;                                // most recent acceleration values
    private long timestamp;                         // time of most recent value

    private double pixle_i;
    private double pixle_j;
    private double roundtrip;
    private double lat;
    private double lon;
    private double heading;
    private double uncertainty;

    private int status;                                 // status of listener

    private int accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;

    //private SensorManager sensorManager;    // Sensor manager
    private Sensor mSensor;                           // NavPosition sensor returned by sensor manager

    private CallbackContext callbackContext;              // Keeps track of the JS callback context.

    private Handler mainHandler=null;
    private Runnable mainRunnable =new Runnable() {
        public void run() {
            IndoorAtlasListener.this.timeout();
        }
    };

    /**
     * Create an indooratlas listener.
     */
    public IndoorAtlasListener() {
        this.x = 0;
        this.y = 0;
        this.timestamp = 0;
        this.pixle_i = 0;
        this.pixle_j = 0;
        this.roundtrip = 0;
        this.lat = 0;
        this.lon = 0;
        this.heading = 0;
        this.uncertainty = 0;
        this.setStatus(IndoorAtlasListener.STOPPED);
     }

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The associated CordovaWebView.
     */
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {

        Log.i(TAG, "initialize");
        super.initialize(cordova, webView);
        initIndoorAtlas();
        //this.sensorManager = (SensorManager) cordova.getActivity().getSystemService(Context.SENSOR_SERVICE);
    }

    /**
     * Executes the request.
     *
     * @param action        The action to execute.
     * @param args          The exec() arguments.
     * @param callbackId    The callback id used when calling back into JavaScript.
     * @return              Whether the action was valid.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        Log.i(TAG, "execute: "+ action + ", args:" + args.toString());
        if (action.equals("start")) {
            this.callbackContext = callbackContext;
            if (this.status != IndoorAtlasListener.RUNNING) {
                // If not running, then this is an async call, so don't worry about waiting
                // We drop the callback onto our stack, call start, and let start and the sensor callback fire off the callback down the road
                //this.start();
                startPositioning();
            }
        }
        else if (action.equals("stop")) {
            if (this.status == IndoorAtlasListener.RUNNING) {
                this.stopPositioning();
            }
        } else {
          // Unsupported action
            return false;
        }

        PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT, "");
        result.setKeepCallback(true);
        callbackContext.sendPluginResult(result);
        return true;
    }

    /**
     * Called by AccelBroker when listener is to be shut down.
     * Stop listener.
     */
    public void onDestroy() {
        Log.i(TAG, "onDestroy");
        this.tearDown();

    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------
    //
    /**
     * Start listening for acceleration sensor.
     * 
     * @return          status of listener
    */
    /*
    private int start() {
        // If already starting or running, then just return
        if ((this.status == IndoorAtlasListener.RUNNING) || (this.status == IndoorAtlasListener.STARTING)) {
            return this.status;
        }

        this.setStatus(IndoorAtlasListener.STARTING);

        // Get indooratlas from sensor manager
        List<Sensor> list = this.sensorManager.getSensorList(Sensor.TYPE_ACCELEROMETER);

        // If found, then register as listener
        if ((list != null) && (list.size() > 0)) {
          this.mSensor = list.get(0);
          this.sensorManager.registerListener(this, this.mSensor, SensorManager.SENSOR_DELAY_UI);
          this.setStatus(IndoorAtlasListener.STARTING);
        } else {
          this.setStatus(IndoorAtlasListener.ERROR_FAILED_TO_START);
          this.fail(IndoorAtlasListener.ERROR_FAILED_TO_START, "No sensors found to register indooratlas listening to.");
          return this.status;
        }

        // Set a timeout callback on the main thread.
        stopTimeout();
        mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.postDelayed(mainRunnable, 2000);

        return this.status;
    }
    */

    private void stopTimeout() {
        if(mainHandler!=null){
            mainHandler.removeCallbacks(mainRunnable);
        }
    }
    /**
     * Stop listening to acceleration sensor.
     */

    /*
    private void stop() {
        stopTimeout();
        if (this.status != IndoorAtlasListener.STOPPED) {
            tearDown();
            //tbd: this.sensorManager.unregisterListener(this);
        }
        this.setStatus(IndoorAtlasListener.STOPPED);
        this.accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    }
    */

    /**
     * Returns an error if the sensor hasn't started.
     *
     * Called two seconds after starting the listener.
     */

    //tbd
    private void timeout() {
        if (this.status == IndoorAtlasListener.STARTING) {
            this.setStatus(IndoorAtlasListener.ERROR_FAILED_TO_START);
            this.fail(IndoorAtlasListener.ERROR_FAILED_TO_START, "Accelerometer could not be started.");
        }
    }

    /**
     * Called when the accuracy of the sensor has changed.
     *
     * @param sensor
     * @param accuracy
     */

    /*
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Only look at indooratlas events
        if (sensor.getType() != Sensor.TYPE_ACCELEROMETER) {
            return;
        }

        // If not running, then just return
        if (this.status == IndoorAtlasListener.STOPPED) {
            return;
        }
        this.accuracy = accuracy;
    }
    */

    /**
     * Sensor listener event.
     *
     * @param SensorEvent event
     */

    /*
    public void onSensorChanged(SensorEvent event) {
        // Only look at indooratlas events
        if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) {
            return;
        }

        // If not running, then just return
        if (this.status == IndoorAtlasListener.STOPPED) {
            return;
        }
        this.setStatus(IndoorAtlasListener.RUNNING);

        if (this.accuracy >= SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM) {

            // Save time that event was received
            this.timestamp = System.currentTimeMillis();
            this.x = event.values[0];
            this.y = event.values[1];
            this.z = event.values[2];

            this.win();
        }
    }
    */

    /**
     * Called when the view navigates.
     */
    //tbd:@Override
    public void onReset() {
        log("onReset");
        if (this.status == IndoorAtlasListener.RUNNING) {
            this.stopPositioning();
        }
    }

    // Sends an error back to JS
    private void fail(int code, String message) {
        log("fail" + code + ", " + message);
        // Error object
        JSONObject errorObj = new JSONObject();
        try {
            errorObj.put("code", code);
            errorObj.put("message", message);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        PluginResult err = new PluginResult(PluginResult.Status.ERROR, errorObj);
        err.setKeepCallback(true);
        callbackContext.sendPluginResult(err);
    }

    private void win() {
        log("win");
        // Success return object
        PluginResult result = new PluginResult(PluginResult.Status.OK, this.getNavPositionJSON());
        result.setKeepCallback(true);
        callbackContext.sendPluginResult(result);
    }

    private void setStatus(int status) {
        this.status = status;
    }
    private JSONObject getNavPositionJSON() {
        JSONObject r = new JSONObject();
        try {
            r.put("x", this.x);
            r.put("y", this.y);
            r.put("timestamp", this.timestamp);
            r.put("i", this.pixle_i);
            r.put("j", this.pixle_j);
            r.put("roundtrip", this.roundtrip);
            r.put("lat", this.lat);
            r.put("lon", this.lon);
            r.put("heading", this.heading);
            r.put("uncertainty", this.uncertainty);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return r;
    }

    /* *************************************************************************** */

    private IndoorAtlas mIndoorAtlas;
    private boolean mIsPositioning;
    private StringBuilder mSharedBuilder = new StringBuilder();

    private void log(final String msg) {
        Log.d(TAG, msg);
        /*
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLogAdapter.add(msg);
                mLogAdapter.notifyDataSetChanged();
            }
        });
        */
    }


    private void initIndoorAtlas() {

        try {

            log("Connecting with IndoorAtlas, apiKey: " + mApiKey);

            Context context=this.cordova.getActivity().getApplicationContext();
            // obtain instance to positioning service, note that calibrating might begin instantly
            mIndoorAtlas = IndoorAtlasFactory.createIndoorAtlas(
                    context, //getApplicationContext(),
                    this, // IndoorAtlasListener
                    mApiKey,
                    mApiSecret);

            log("IndoorAtlas instance created");

        } catch (IndoorAtlasException ex) {
            this.status = IndoorAtlasListener.ERROR_FAILED_TO_START;
            Log.e("IndoorAtlas", "init failed", ex);
            log("init IndoorAtlas failed, " + ex.toString());
        }

    }

    private void tearDown() {
        log("tearDown");
        if (mIndoorAtlas != null) {
            this.status = IndoorAtlasListener.STOPPED;
            mIndoorAtlas.tearDown();
        }
    }

    private void stopPositioning() {
        mIsPositioning = false;
        if (mIndoorAtlas != null) {
            log("Stop positioning");
            mIndoorAtlas.stopPositioning();
            this.status = IndoorAtlasListener.STOPPED;
        }
    }

    /**
     * This is where you will handle location updates.
     */
    public void onServiceUpdate(ServiceState state) {

        mSharedBuilder.setLength(0);
        mSharedBuilder.append("Location: ")
                .append("\n\troundtrip : ").append(state.getRoundtrip()).append("ms")
                .append("\n\tlat : ").append(state.getGeoPoint().getLatitude())
                .append("\n\tlon : ").append(state.getGeoPoint().getLongitude())
                .append("\n\tX [meter] : ").append(state.getMetricPoint().getX())
                .append("\n\tY [meter] : ").append(state.getMetricPoint().getY())
                .append("\n\tI [pixel] : ").append(state.getImagePoint().getI())
                .append("\n\tJ [pixel] : ").append(state.getImagePoint().getJ())
                .append("\n\theading : ").append(state.getHeadingDegrees())
                .append("\n\tuncertainty: ").append(state.getUncertainty());

        log(mSharedBuilder.toString());

        // If not running, then just return
        if (this.status == IndoorAtlasListener.STOPPED) {
            return;
        }
        this.setStatus(IndoorAtlasListener.RUNNING);

        // Save time that event was received
        this.roundtrip = state.getRoundtrip();
        this.lat = state.getGeoPoint().getLatitude();
        this.lon = state.getGeoPoint().getLongitude();
        this.timestamp = System.currentTimeMillis();
        this.x = state.getMetricPoint().getX();
        this.y = state.getMetricPoint().getY();
        this.pixle_i = state.getImagePoint().getI();
        this.pixle_j = state.getImagePoint().getJ();
        this.heading = state.getHeadingDegrees();
        this.uncertainty = state.getUncertainty();

        this.win();
    }

    @Override
    public void onServiceFailure(int errorCode, String reason) {
        log("onServiceFailure: reason : " + reason);
        this.status = IndoorAtlasListener.ERROR_FAILED_TO_START;

        this.setStatus(IndoorAtlasListener.ERROR_FAILED_TO_START);
        this.fail(IndoorAtlasListener.ERROR_FAILED_TO_START, reason);
    }

    @Override
    public void onServiceInitializing() {

        this.status = IndoorAtlasListener.STARTING;
        log("onServiceInitializing()");
    }

    @Override
    public void onServiceInitialized() {
        this.status = IndoorAtlasListener.RUNNING;
        log("onServiceInitialized()");
    }

    @Override
    public void onInitializationFailed(final String reason) {
        this.status = IndoorAtlasListener.ERROR_FAILED_TO_START;
        log("onInitializationFailed(): " + reason);

        this.setStatus(IndoorAtlasListener.ERROR_FAILED_TO_START);
        this.fail(IndoorAtlasListener.ERROR_FAILED_TO_START, reason);
    }

    @Override
    public void onServiceStopped() {

        log("onServiceStopped()");

        if (this.status == IndoorAtlasListener.RUNNING) {
            this.stopPositioning();
        }

    }

    @Override
    public void onCalibrationStatus(CalibrationState calibrationState) {

        log("onCalibrationStatus: event: " + calibrationState.getCalibrationEvent()
                + ", percentage: " + calibrationState.getPercentage());

    }

    @Override
    public void onCalibrationFailed(String reason) {
        log("onCalibrationFailed(): Please do figure '8' motion until " +
                "onCalibrationFinished() or onCalibrationFailed() is called");

        this.setStatus(IndoorAtlasListener.ERROR_FAILED_TO_START);
        this.fail(IndoorAtlasListener.ERROR_FAILED_TO_START, "Calibration failed, Please do figure '8' motion");
    }

    @Override
    public void onCalibrationInvalid() {

        log("Calibration Invalid");

        this.setStatus(IndoorAtlasListener.ERROR_FAILED_TO_START);
        this.fail(IndoorAtlasListener.ERROR_FAILED_TO_START, "Calibration Invalid");
    }

    /**
     * Calibration successful, positioning can be started
     */
    @Override
    public void onCalibrationReady() {
        log("onCalibrationReady");
        startPositioning();
    }

    @Override
    public void onNetworkChangeComplete(boolean success) {
        log("onNetworkChangeComplete");
    }

    private void startPositioning() {
        log("startPositioning");
        if (mIndoorAtlas != null && mIndoorAtlas.isCalibrationReady()) {
            log(String.format("startPositioning, venueId: %s, floorId: %s, floorPlanId: %s",
                    mVenueId,
                    mFloorId,
                    mFloorPlanId));
            try {
                mIndoorAtlas.startPositioning(mVenueId, mFloorId, mFloorPlanId);
                mIsPositioning = true;
            } catch (IndoorAtlasException e) {
                log("startPositioning failed: " + e);
            }
        } else {
            log("calibration not ready, cannot start positioning");
        }
    }

}
