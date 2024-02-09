"use strict";

const { Device } = require("homey");
const ModbusModel = require("../modbus/modbus_model");

class AirtempDevice extends Device {
  
  _api = null;
  _pollList = [];
  _pollTimer = null;
  _settings = null;  
  
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    console.log("Airtemp device initiated.");
    this._api = this.driver.modbus_client;
    console.log(this._api);
    this.assemblePollList();
    this.subscribeToEvents();
  }


  assemblePollList() {
    // capabilities: ["automan", "target_temperature", "measure_temperature", "hysteresis"],
    this._pollList = [];
    this._pollList.push({ capability: 'automan', modbus_item: ModbusModel.AIRHEATER_AUTO });
    this._pollList.push({ capability: 'target_temperature', modbus_item: ModbusModel.SP_AIRTEMP });
    this._pollList.push({ capability: 'measure_temperature', modbus_item: ModbusModel.AIR_TEMP });
    this._pollList.push({ capability: 'hysteresis', modbus_item: ModbusModel.HYST_AIRTEMP });

    this.log('Assembled a new pollinglist');
    this._pollList.forEach(value => {
      this.log(value);
    });
  }


    /**
   * Subscribe to events from api.
   * Mainly to control connection status.
   */
    subscribeToEvents() {
      // Socket connected
      this._api.events.on('connected', () => {
        this.log('Socket has connected');
        this.setAvailable();
        this.startPoll();
      });
  
      // Socket disconnected
      this._api.events.on('disconnected', () => {
        this.log('Socket has disconnected.');
        clearInterval(this._pollTimer);
        this.setUnavailable('The device is offline.');
      });
    }
  

  /**
   * Start the polling. Called from on connected and settings saved.
   */
  startPoll() {
    this._pollTimer = this.homey.setInterval(() => {
      this._pollList.forEach(item => {
        this.log(`Polling capability: ${item.capability}`);
        this._api.readValue(item).then(res => {
          if (item.capability == "automan") {
            this.setCapabilityValue(item.capability, res)
          }
          if (item.capability == "measure_temperature") {
            this.setCapabilityValue(item.capability, res/10);
          }
          if (item.capability == "target_temperature") {
            this.setCapabilityValue(item.capability, res / 10);
          }
          if (item.capability == "hysteresis") {
            this.setCapabilityValue(item.capability, res/10);
          }

        }).catch(err => {
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
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log("MyDevice was renamed");
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log("MyDevice has been deleted");
  }
}

module.exports = AirtempDevice;
