"use strict";

const { Device } = require("homey");
const ModbusModel = require("../modbus/modbus_model");

class ExhaustDevice extends Device {
  _api = null;
  _pollList = [];
  _pollTimer = null;
  _settings = {};

  _decimal = 1;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    console.log("Exhaust device initiated.");
    this._settings = this.getSettings();
    if (this._settings["exhaust_decimal"] != 0) this._decimal = 10 ** this._settings['exhaust_decimal'];
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
      modbus_item: ModbusModel.EXHAUST_AUTO,
    });
    this._pollList.push({
      capability: "onoff",
      modbus_item: ModbusModel.EXHAUST_ONOFF,
    });
    this._pollList.push({
      capability: "measure_humidity",
      modbus_item: ModbusModel.HUMIDITY,
    });
    this._pollList.push({
      capability: "exhaust_output",
      modbus_item: ModbusModel.EXHAUST_OUTPUT,
    });
    this._pollList.push({
      capability: "sp_humidity",
      modbus_item: ModbusModel.SP_HUMIDITY,
    });
    this._pollList.push({
      capability: "hysterese_humidity",
      modbus_item: ModbusModel.HYST_HUMIDITY,
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
    // Exhaust AUTO ON/OFF
    this.registerCapabilityListener("automan", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.EXHAUST_AUTO.address, value)
        .catch((err) => {
          console.log(err);
        });
    });

    // Exhaustfan ON/OFF
    this.registerCapabilityListener("onoff", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.EXHAUST_ONOFF.address, value)
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
            if (item.capability == "exhaust_output") {
              // Syncronize onoff with regulator and override hardware
              if (this.getCapabilityValue("onoff") != res) {
                this.setCapabilityValue("onoff", res);
              }
            }
            if (item.capability == "automan") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "onoff") {
              if (this.getCapabilityValue("exhaust_output") == res) {
                this.setCapabilityValue(item.capability, res);
              } 
            }
            if (item.capability == "measure_humidity") {
              this.setCapabilityValue(item.capability, res / this._decimal);
            }
            // Update the settings if timer is changed elsewhere.
            if (item.capability == "sp_humidity") {
              if (this._settings["sp_humidity"] != res) {
                await this.setSettings({ sp_humidity: res / this._decimal }).catch((err) =>
                  console.log(err)
                );
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "hysterese_humidity") {
              if (this._settings["hysterese_humidity"] != res) {
                //console.log("Result from poll: ", res);
                //this._settings["growlights_off"] = res;
                await this.setSettings({ hysterese_humidity: res / this._decimal }).catch((err) =>
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
    this.log("Exhaust settings where changed");
    this._settings = newSettings;
    // console.log("Settingskey changed: ", changedKeys);
    
    if (changedKeys.includes("sp_humidity")) {
      console.log("Humidity SP changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.SP_HUMIDITY.address,
          newSettings["sp_humidity"] * this._decimal
        )
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("hysterese_humidity")) {
      await this._api
        .writeSingleRegister(
          ModbusModel.HYST_HUMIDITY.address,
          newSettings["hysterese_humidity"] * this._decimal
        )
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("exhaust_decimal")) {
        if (this._settings["exhaust_decimal"] != 0) this._decimal = 10 ** this._settings['exhaust_decimal'];
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
    this.log("Exhaustdevice has been deleted");
  }
}

module.exports = ExhaustDevice;
