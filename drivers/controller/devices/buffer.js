"use strict";

const { Device } = require("homey");
const ModbusModel = require("../modbus/modbus_model");

class BufferDevice extends Device {
  _api = null;
  _pollList = [];
  _pollTimer = null;
  _settings = {};

  _decimal = 1;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    console.log("Buffer device initiated.");
    this._settings = this.getSettings();
    // Set the devices decimal correction
    if (this._settings["buffer_decimal"] != 0) this._decimal = 10 ** this._settings["buffer_decimal"];

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
      capability: "alarm_water.H",
      modbus_item: ModbusModel.BUFFERLEVEL_H,
    });
    this._pollList.push({
      capability: "alarm_water.L",
      modbus_item: ModbusModel.BUFFERLEVEL_L,
    });
    this._pollList.push({
      capability: "alarm_water.LL",
      modbus_item: ModbusModel.BUFFERLEVEL_LL,
    });
    this._pollList.push({
      capability: "measure_waterlevel",
      modbus_item: ModbusModel.BUFFERLEVEL,
    });
    this._pollList.push({
      capability: "sp_buffer_h",
      modbus_item: ModbusModel.SP_BUFFER_H,
    });
    this._pollList.push({
      capability: "sp_buffer_l",
      modbus_item: ModbusModel.SP_BUFFER_L,
    });
    this._pollList.push({
      capability: "sp_buffer_ll",
      modbus_item: ModbusModel.SP_BUFFER_LL,
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
    //
    // this.registerCapabilityListener("automan", async (value) => {
    //   this._api
    //     .writeSingleCoil(ModbusModel.EXHAUST_AUTO.address, value)
    //     .catch((err) => {
    //       console.log(err);
    //     });
    // });
  }

  /**
   * Start the polling. Called from on connected and settings saved.
   */
  startPoll() {
    this._pollTimer = this.homey.setInterval(() => {
      this._pollList.forEach((item) => {
        this._api
          .readValue(item)
          .then(async (res) => {
            if (item.capability == "alarm_water.H") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "alarm_water.L") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "alarm_water.LL") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "measure_waterlevel") {
              this.setCapabilityValue(item.capability, res);
            }
            // Update the settings if set somewhere else.
            if (item.capability == "sp_buffer_h") {
              if (this._settings["buffer_h"] != res) {
                await this.setSettings({ buffer_h: res / this._decimal }).catch((err) => console.log(err));
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "sp_buffer_l") {
              if (this._settings["buffer_l"] != res) {
                await this.setSettings({ buffer_l: res / this._decimal }).catch((err) => console.log(err));
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "sp_buffer_ll") {
              if (this._settings["buffer_ll"] != res) {
                await this.setSettings({ buffer_ll: res / this._decimal }).catch((err) => console.log(err));
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

    if (changedKeys.includes("buffer_h")) {
      console.log("Buffer H Alarm Changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.SP_BUFFER_H.address,
          newSettings["buffer_h"] * this._decimal
        )
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("buffer_l")) {
      console.log("Buffer L alarm changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.SP_BUFFER_L.address,
          newSettings["buffer_l"] * this._decimal
        )
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("buffer_ll")) {
      console.log("Buffer LL alarm changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.SP_BUFFER_LL.address,
          newSettings["buffer_ll"] * this._decimal
        )
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("buffer_decimal")) {
      if (this._settings["buffer_decimal"] != 0)
        this._decimal = 10 ** this._settings["buffer_decimal"];
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

module.exports = BufferDevice;
