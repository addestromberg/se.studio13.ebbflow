'use strict';

const { Driver } = require('homey');
const ModbusClient = require('./modbus/modbus_client');
const ModbusModel = require('./modbus/modbus_model');

class MyDriver extends Driver {

  client = new ModbusClient("192.168.86.150", 502);
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
   
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      {
        name: 'Airtemp Regulator',
        data: {
          id: 'airtemp-reg',
        },
        store: {
          type: "airtemp-reg"
        }
      },
      {
        name: 'Watertemp Regulator',
        data: {
          id: 'watertemp-reg',
        },
        store: {
          type: "watertemp-reg"
        }
      },
      {
        name: 'Growlight Regulator',
        data: {
          id: 'growlight-reg',
        },
        store: {
          type: "growlight-reg"
        }
      },
      {
        name: 'Exhaust Regulator',
        data: {
          id: 'exhaust-reg',
        },
        store: {
          type: "exhaust-reg"
        }
      },
      {
        name: 'Airmixers Regulator',
        data: {
          id: 'airmixers-reg',
        },
        store: {
          type: "airmixers-reg"
        }
      },
      {
        name: 'Buffertank',
        data: {
          id: 'buffertank',
        },
        store: {
          type: "buffertank"
        }
      },
      {
        name: 'Tray A',
        data: {
          id: 'tray-a',
        },
        store: {
          type: "tray-a"
        }
      },
      {
        name: 'Tray B',
        data: {
          id: 'tray-b',
        },
        store: {
          type: "tray-b"
        }
      },
    ];
  }

}

module.exports = MyDriver;
