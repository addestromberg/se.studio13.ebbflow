"use strict";

const { Device } = require("homey");
const ModbusModel = require("../modbus/modbus_model");

class GrowinglightsDevice extends Device {
  _api = null;
  _pollList = [];
  _pollTimer = null;
  _settings = {};

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    console.log("Growinglights device initiated.");
    this._settings = this.getSettings();
    // console.log(this._settings);

    this._api = this.driver.getClient(
      this._settings["ip"],
      this._settings["port"]
    );
    this.assemblePollList();
    this.subscribeToEvents();
    this.addCapabilityListeners();
  }

  assemblePollList() {
    // capabilities: ["automan", "onoff"],
    this._pollList = [];
    this._pollList.push({
      capability: "automan",
      modbus_item: ModbusModel.LIGHTS_AUTO,
    });
    this._pollList.push({
      capability: "onoff",
      modbus_item: ModbusModel.LIGHTS_ONOFF,
    });
    this._pollList.push({
      capability: "lightoutput",
      modbus_item: ModbusModel.GROWLIGHTS_OUTPUT,
    });
    this._pollList.push({
      capability: "ontime",
      modbus_item: ModbusModel.SP_GROWINGLIGHTS_ON,
    });
    this._pollList.push({
      capability: "offtime",
      modbus_item: ModbusModel.SP_GROWINGLIGHTS_OFF,
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
    // AUTO ON/OFF
    this.registerCapabilityListener("automan", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.LIGHTS_AUTO.address, value)
        .catch((err) => {
          console.log(err);
        });
    });

    // HEATER ON/OFF
    this.registerCapabilityListener("onoff", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.LIGHTS_ONOFF.address, value)
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
            if (item.capability == "lightoutput") {
              // Syncronize onoff with timer and override hardware
              if (this.getCapabilityValue("onoff") != res) {
                this.setCapabilityValue("onoff", res);
              }
            }
            if (item.capability == "automan") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "onoff") {
              if (this.getCapabilityValue("lightoutput") == res) {
                this.setCapabilityValue(item.capability, res);
              }
            }
            // Update the settings if timer is changed elsewhere.
            if (item.capability == "ontime") {
              if (this._settings["growlights_on"] != res) {
                await this.setSettings({ growlights_on: res }).catch((err) =>
                  console.log(err)
                );
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "offtime") {
              if (this._settings["growlights_off"] != res) {
                //console.log("Result from poll: ", res);
                //this._settings["growlights_off"] = res;
                await this.setSettings({ growlights_off: res }).catch((err) =>
                  console.log(err)
                );
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
    this.log("Airtemp has been added");
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
    // console.log("Settingskey changed: ", changedKeys);
    
    if (changedKeys.includes("growlights_on")) {
      console.log("Growlights timer changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.SP_GROWINGLIGHTS_ON.address,
          newSettings["growlights_on"]
        )
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("growlights_off")) {
      await this._api
        .writeSingleRegister(
          ModbusModel.SP_GROWINGLIGHTS_OFF.address,
          newSettings["growlights_off"]
        )
        .then((res) => {
          console.log(res);
        })
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

    return "Saved!";
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log("MyDevice has been deleted");
  }
}

module.exports = GrowinglightsDevice;
