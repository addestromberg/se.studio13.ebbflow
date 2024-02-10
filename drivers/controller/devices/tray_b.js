"use strict";

const { Device } = require("homey");
const ModbusModel = require("../modbus/modbus_model");

class TrayBDevice extends Device {
  _api = null;
  _pollList = [];
  _pollTimer = null;
  _settings = {};

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    console.log("Tray B device initiated.");
    this._settings = this.getSettings();
    // Set the devices decimal correction

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
      modbus_item: ModbusModel.EFB_AUTO,
    });
    this._pollList.push({
      capability: "flowpump",
      modbus_item: ModbusModel.FLOWPUMP_B_ONOFF,
    });
    this._pollList.push({
      capability: "drainvalve",
      modbus_item: ModbusModel.DUMPVALVE_B_OPENCLOSE,
    });
    this._pollList.push({
      capability: "flowpump_output",
      modbus_item: ModbusModel.FLOWPUMP_B_OUTPUT,
    });
    this._pollList.push({
      capability: "drainvalve_output",
      modbus_item: ModbusModel.DUMPVALVE_B_OUTPUT,
    });

    this._pollList.push({
      capability: "flood_time_b",
      modbus_item: ModbusModel.EFB_FLOOD_TIME,
    });
    this._pollList.push({
      capability: "flow_time_b",
      modbus_item: ModbusModel.EFB_FLOW_TIME,
    });
    this._pollList.push({
      capability: "ebb_time_b",
      modbus_item: ModbusModel.EFB_EBB_TIME,
    });
    this._pollList.push({
      capability: "drain_time_b",
      modbus_item: ModbusModel.EFB_DRAIN_TIME,
    });
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
        .writeSingleCoil(ModbusModel.EFB_AUTO.address, value)
        .catch((err) => {
          console.log(err);
        });
    });

    // Flowpump ON/OFF
    this.registerCapabilityListener("flowpump", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.FLOWPUMP_B_ONOFF.address, value)
        .catch((err) => {
          console.log(err);
        });
    });

    // Drainvalve ON/OFF
    this.registerCapabilityListener("drainvalve", async (value) => {
      this._api
        .writeSingleCoil(ModbusModel.DUMPVALVE_B_OPENCLOSE.address, value)
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
        this._api
          .readValue(item)
          .then(async (res) => {
            if (item.capability == "automan") {
              this.setCapabilityValue(item.capability, res);
            }
            if (item.capability == "flowpump_output") {
              // Syncronize onoff with timer and override hardware
              if (this.getCapabilityValue("flowpump") != res) {
                this.setCapabilityValue("flowpump", res);
              }
            }
            if (item.capability == "flowpump") {
              if (this.getCapabilityValue("flowpump_output") == res) {
                this.setCapabilityValue(item.capability, res);
              }
            }

            if (item.capability == "drainvalve_output") {
              // Syncronize onoff with timer and override hardware
              if (this.getCapabilityValue("drainvalve") != res) {
                this.setCapabilityValue("drainvalve", res);
              }
            }
            if (item.capability == "drainvalve") {
              if (this.getCapabilityValue("drainvalve_output") == res) {
                this.setCapabilityValue(item.capability, res);
              }
            }

            // Update the settings if set somewhere else.
            if (item.capability == "flood_time_b") {
              if (this._settings["flood_time_b"] != res) {
                await this.setSettings({ flood_time_b: res }).catch((err) =>
                  console.log(err)
                );
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "flow_time_b") {
              if (this._settings["flow_time_b"] != res) {
                await this.setSettings({ flow_time_b: res }).catch((err) =>
                  console.log(err)
                );
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "ebb_time_b") {
              if (this._settings["ebb_time_b"] != res) {
                await this.setSettings({
                  ebb_time_b: res,
                }).catch((err) => console.log(err));
                this._settings = this.getSettings();
              }
            }
            if (item.capability == "drain_time_b") {
              if (this._settings["drain_time_b"] != res) {
                await this.setSettings({
                  drain_time_b: res,
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
    this.log("Tray B settings where changed");
    this._settings = newSettings;
    // console.log("Settingskey changed: ", changedKeys);

    if (changedKeys.includes("flood_time_b")) {
      console.log("flood_time_b Changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.EFB_FLOOD_TIME.address,
          newSettings["flood_time_b"]
        )
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("flow_time_b")) {
      console.log("flow_time_b changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.EFB_FLOW_TIME.address,
          newSettings["flow_time_b"]
        )
        .then((res) => console.log(res))
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("ebb_time_b")) {
      console.log("ebb_time_b changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.EFB_EBB_TIME.address,
          newSettings["ebb_time_b"]
        )
        .catch((err) => {
          console.log(err);
        });
    }

    if (changedKeys.includes("drain_time_b")) {
      console.log("drain_time_b changed. Writing to register.");
      await this._api
        .writeSingleRegister(
          ModbusModel.EFB_DRAIN_TIME.address,
          newSettings["drain_time_b"]
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

    return "Saved!";
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log("Tray a device has been deleted");
  }
}

module.exports = TrayBDevice;
