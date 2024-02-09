"use strict";

const { Driver, Device } = require("homey");
const ModbusClient = require("./modbus/modbus_client");
const ModbusModel = require("./modbus/modbus_model");

const GenericDevice = require("./device");
const AirtempDevice = require("./devices/airtemp");
const WatertempDevice = require("./devices/watertemp");

class ControllerDriver extends Driver {
  modbus_client = null;

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log("ControllerDriver has been initialized");
    this.modbus_client = new ModbusClient("192.168.86.150", 502);
  }

  /**
   * Map devices to there extended classes.
   * @param {*} device
   * @returns
   */
  onMapDeviceClass(device) {
    let id = device.getData().id;
    console.log(id);

    if (id == "airtemp-reg") {
      return AirtempDevice;
    } else if (id == "watertemp-reg") {
      return WatertempDevice;
    } else {
      this.error("Couldn't find devicetype.");
      return GenericDevice;
    }

    return AirtempDevice;
    // if( settings.type == "airtemp-reg" ) {
    //   return AirtempRegDev;
    // } else {
    //   console.log("Device isn't found.");
    // }
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      {
        name: "Airtemp Regulator",
        data: {
          id: "airtemp-reg",
        },
        capabilities: ["automan", "target_temperature", "measure_temperature", "hysteresis"],
        capabilitiesOptions: {
          target_temperature: {
            min: 5,
            max: 35,
          },
        },
      },
      {
        name: "Watertemp Regulator",
        data: {
          id: "watertemp-reg",
        },
        capabilities: ["automan", "target_temperature", "measure_temperature", "hysteresis"],
        capabilitiesOptions: {
          target_temperature: {
            min: 5,
            max: 35,
          },
        },
      },
      {
        name: "Growlight Regulator",
        data: {
          id: "growlight-reg",
        },
        capabilities: ["onoff", ""],
        capabilitiesOptions: {
          target_temperature: {
            min: 5,
            max: 35,
          },
        },
      },
      {
        name: "Exhaust Regulator",
        data: {
          id: "exhaust-reg",
        },

      },
      {
        name: "Airmixers Regulator",
        data: {
          id: "airmixers-reg",
        },
      },
      {
        name: "Buffertank",
        data: {
          id: "buffertank",
        },
      },
      {
        name: "Tray A",
        data: {
          id: "tray-a",
        },
      },
      {
        name: "Tray B",
        data: {
          id: "tray-b",
        },
      },
    ];
  }
}

module.exports = ControllerDriver;
