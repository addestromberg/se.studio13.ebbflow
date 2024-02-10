"use strict";

const { Device } = require("homey");
const ModbusModel = require("../modbus/modbus_model");

class WatertempDevice extends Device {
  _api = null;
  _pollList = [];
  _pollTimer = null;
  _settings = null;

  _decimal = 1;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    console.log("Watertemp device initiated.");
    this._settings = this.getSettings();
    // console.log(this._settings);
    // Preload the decimal correction.
    if (this._settings["decimals"] != 0) this._decimal = 10 ** this._settings['decimals'];
    
    this._api = this.driver.getClient(
      this._settings["ip"],
      this._settings["port"]
    );
    // console.log(this._api);
    this.assemblePollList();
    this.subscribeToEvents();
    this.addCapabilityListeners();
  }

  assemblePollList() {
    // capabilities: ["automan", "target_temperature", "measure_temperature", "hysteresis"],
    this._pollList = [];
    this._pollList.push({
      capability: "automan",
      modbus_item: ModbusModel.WATERHEATER_AUTO,
    });
    this._pollList.push({
      capability: "target_temperature",
      modbus_item: ModbusModel.SP_WATERTEMP,
    });
    this._pollList.push({
      capability: "measure_temperature",
      modbus_item: ModbusModel.WATER_TEMP,
    });
    this._pollList.push({
      capability: "hysteresis",
      modbus_item: ModbusModel.HYST_WATERTEMP,
    });
    this._pollList.push({
      capability: "onoff",
      modbus_item: ModbusModel.WATERHEATER_ONOFF,
    });

    // this.log('Assembled a new pollinglist');
    // this._pollList.forEach(value => {
    //   this.log(value);
    // });
  }

  /**
   * Subscribe to events from api.
   * Mainly to control connection status.
   */
  subscribeToEvents() {
    // Socket connected
    this._api.events.on("connected", () => {
      // this.log("Socket has connected");
      this.setAvailable();
      this.startPoll();
    });

    // Socket disconnected
    this._api.events.on("disconnected", () => {
      // this.log("Socket has disconnected.");
      clearInterval(this._pollTimer);
      this.setUnavailable("The device is offline.");
    });
  }

  /**
   * Add capabilities based on features available.
   * In case capability is settable. Add CapabilityListener
   */
  addCapabilityListeners() {
    // Watertemp setpoint
    this.registerCapabilityListener("target_temperature", async (value) => {
      // console.log(this._decimal);
      this._api
        .writeSingleRegister(ModbusModel.SP_WATERTEMP.address, value * this._decimal)
        .catch((err) => {
          console.log(err);
        });
    });

    // Hysterese setpoint
    this.registerCapabilityListener("hysteresis", async (value) => {
      this._api
        .writeSingleRegister(ModbusModel.HYST_WATERTEMP.address, value) // Uses predefined array. No need to multiply decimals.
        .catch((err) => {
          console.log(err);
        });
    });

    // AUTO ON/OFF
    this.registerCapabilityListener("automan", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.WATERHEATER_AUTO.address, value)
        .catch((err) => {
          console.log(err);
        });
    });

    // HEATER ON/OFF
    this.registerCapabilityListener("onoff", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.WATERHEATER_ONOFF.address, value)
        .catch((err) => {
          console.log(err);
        });
    });
  }

  /**
   * Start the polling. Called from on connected and settings saved.
   */
  startPoll() {
    this._pollTimer = this.homey.setInterval(() => {
      this._pollList.forEach((item) => {
        // this.log(`Polling capability: ${item.capability}`);
        this._api
          .readValue(item)
          .then((res) => {
            if (item.capability == "automan") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "measure_temperature") {
              this.setCapabilityValue(item.capability, res / this._decimal);
            }
            if (item.capability == "target_temperature") {
              this.setCapabilityValue(item.capability, res / this._decimal);
            }
            if (item.capability == "hysteresis") {
              // Becouse there are no input boxes in homey, we need to use a picker or slider.
              // so let's use a fixed picker with .5 degree steps on hysteresis.
              // console.log("Result from hysteresis:  %d", res)
              let value = Math.ceil(res/5)*5; // Round to closest 5.
              if (value > 50) value = 50; // Picker array maximum
              if (value < 0) value = 0; // Picker array minimum
              this.setCapabilityValue(item.capability, value.toString());
            }
          })
          .catch((err) => {
            this.log(err);
          });
      });
    }, 10000);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log("Watertemp has been added");
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log("MyDevice settings where changed");
    this._settings = newSettings;
    // Redo decimal preload.
    if (this._settings["decimals"] != 0) this._decimal = 10 ** this._settings['decimal'];
    // Reload Client
    this._api = this.driver.getClient(
      this._settings["ip"],
      this._settings["port"]
    );
    this.subscribeToEvents();
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log("MyDevice has been deleted");
  }
}

module.exports = WatertempDevice;
