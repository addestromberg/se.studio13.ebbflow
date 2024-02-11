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
    if (this._settings["watertemp_decimal"] != 0)
      this._decimal = 10 ** this._settings["watertemp_decimal"];

    this._api = this.driver.getClient(
      this._settings["ip"],
      this._settings["port"]
    );
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
      capability: "hysterese",
      modbus_item: ModbusModel.HYST_WATERTEMP,
    });
    this._pollList.push({
      capability: "onoff",
      modbus_item: ModbusModel.WATERHEATER_ONOFF,
    });
    this._pollList.push({
      capability: "heater_output",
      modbus_item: ModbusModel.WATERHEATER_OUTPUT,
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
    // Airtemp setpoint
    this.registerCapabilityListener("target_temperature", async (value) => {
      this._api
        .writeSingleRegister(
          ModbusModel.SP_WATERTEMP.address,
          value * this._decimal
        )
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
          .then(async (res) => {
            if (item.capability == "automan") {
              this.setCapabilityValue(item.capability, res);
            }
            
            if (item.capability == "heater_output") {
              // Syncronize onoff with timer and override hardware
              if (this.getCapabilityValue("onoff") != res) {
                this.setCapabilityValue("onoff", res);
              }
            }
            if (item.capability == "onoff") {
              if (this.getCapabilityValue("heater_output") == res) {
                this.setCapabilityValue(item.capability, res);
              }
            }

            if (item.capability == "measure_temperature") {
              this.setCapabilityValue(item.capability, res / this._decimal);
            }
            if (item.capability == "target_temperature") {
              this.setCapabilityValue(item.capability, res / this._decimal);
            }
            if (item.capability == "hysterese") {
              if (this._settings["watertemp_hysterese"] != res / this._decimal) {
                await this.setSettings({
                  watertemp_hysterese: res / this._decimal,
                }).catch((err) => console.log(err));
                this._settings = this.getSettings();
              }
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
    this.log("Watertemp settings where changed");
    this._settings = newSettings;
    if (changedKeys.includes("watertemp_hysterese")) {
      console.log("watertemp_hysterese changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.HYST_WATERTEMP.address,
          newSettings["watertemp_hysterese"] * this._decimal
        )
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("ip") || changedKeys.includes("port")) {
      this._api = this.driver.getClient(
        this._settings["ip"],
        this._settings["port"]
      );
      this.subscribeToEvents();
    }

    if (changedKeys.includes("watertemp_decimal")) {
      if (this._settings["watertemp_decimal"] > 0) {
        this._decimal = 10 ** this._settings["watertemp_decimal"];
      } else {
        this._decimal = 1;
      }
    }

    return "Saved!";
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log("Watertemp device has been deleted");
  }
}

module.exports = WatertempDevice;
