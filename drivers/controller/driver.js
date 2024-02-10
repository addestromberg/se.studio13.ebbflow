"use strict";

const { Driver, Device } = require("homey");
const ModbusClient = require("./modbus/modbus_client");
const ModbusModel = require("./modbus/modbus_model");

const GenericDevice = require("./device");
const AirtempDevice = require("./devices/airtemp");
const WatertempDevice = require("./devices/watertemp");
const GrowinglightsDevice = require("./devices/growinglights");
const AirmixersDevice = require("./devices/airmixers");
const ExhaustDevice = require("./devices/exhaust");
const BufferDevice = require("./devices/buffer");

class ControllerDriver extends Driver {
  // Example object
  // modbus_client = {
  //   "192.168.86.150": {
  //     port: 502,
  //     client: ModbusClient()
  //   }
  // };
  modbus_clients = {};

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log("ControllerDriver has been initialized");

    // this.modbus_client = new ModbusClient("192.168.86.150", 502);
  }

  /**
   * Checks if a client for address and port exists. Otherwise
   * create a new client and return that.
   * @param {string} address 
   * @param {int} port 
   * @returns ModbusClient
   */
  getClient(address, port) {
    if (address in this.modbus_clients) {
      if (this.modbus_clients[address].port == port) {
        return this.modbus_clients[address].client;
      } else {
        let client = new ModbusClient(address, port);
        this.modbus_clients[address] = { port: port, client: client };
        return this.modbus_clients[address].client;
      }
    } else {
      let client = new ModbusClient(address, port);
      this.modbus_clients[address] = { port: port, client: client };
      return this.modbus_clients[address].client;
    }
  }

  /**
   * Map devices to there extended classes.
   * @param {*} device
   * @returns
   */
  onMapDeviceClass(device) {
    let id = device.getData().id;
    // console.log(id);

    if (id == "airtemp-reg") {
      return AirtempDevice;
    } else if (id == "watertemp-reg") {
      return WatertempDevice;
    } else if (id == "growlight-reg") {
      return GrowinglightsDevice;
    } else if (id == "airmixers-reg") {
      return AirmixersDevice;
    } else if (id == "exhaust-reg") {
      return ExhaustDevice;
    } else if (id == "buffertank") {
      return BufferDevice;
    } else {
      this.error("Couldn't find devicetype.");
      return GenericDevice;
    }
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
        capabilities: [
          "automan",
          "target_temperature",
          "measure_temperature",
          "hysteresis",
          "onoff",
        ],
        capabilitiesOptions: {
          target_temperature: {
            min: 0,
            max: 35,
          },
        },
      },
      {
        name: "Watertemp Regulator",
        data: {
          id: "watertemp-reg",
        },
        capabilities: [
          "automan",
          "target_temperature",
          "measure_temperature",
          "hysteresis",
          "onoff"
        ],
        capabilitiesOptions: {
          target_temperature: {
            min: 0,
            max: 35,
          },
        },
      },
      {
        name: "Growlight Regulator",
        data: {
          id: "growlight-reg",
        },
        capabilities: ["onoff", "automan"],
      },
      {
        name: "Exhaust Regulator",
        data: {
          id: "exhaust-reg",
        },
        capabilities: ["onoff", "automan", "measure_humidity"],
      },
      {
        name: "Airmixers Regulator",
        data: {
          id: "airmixers-reg",
        },
        capabilities: ["onoff", "automan"],
      },
      {
        name: "Buffertank",
        data: {
          id: "buffertank",
        },
        capabilities: ["alarm_water.H", "alarm_water.L", "alarm_water.LL", "measure_waterlevel"],
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
