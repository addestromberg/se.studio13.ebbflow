/* eslint-disable no-console */

'use strict';

const Modbus = require('jsmodbus');
const net = require('net');
const _eventEmitter = require('events');
const ModbusModel = require('./modbus_model');

const _socket = new net.Socket();

class ModbusClient {

  constructor(host, port) {
    this.client = new Modbus.client.TCP(_socket, 0, 10000);
    this.client.set
    this.options = { host, port };
    this.events = new _eventEmitter.EventEmitter();
    this.subscribeToSocketEvents();
    this.connect();
  }

  connect() {
    _socket.connect(this.options, 0);
  }

  connected() {
    return new Promise((resolve, reject) => {
      if (this.client.connectionState === 'online') {
        resolve('connected');
      } else {
        reject(new Error('disconnected'));
      }
    });
  }

  subscribeToSocketEvents() {
    _socket.on('connect', () => {
      console.log('Socket connected');
      this.events.emit('connected');
    });
    _socket.on('error', err => {
      console.log(`Socket Error${err}`);
      // The connection failed. Wait 10 seconds and try again.
      this.events.emit('disconnected');
      setTimeout(() => {
        this.connect();
      }, 10000);
    });
    _socket.on('end', () => {
      console.log('Socket disconnected');
      // The connection failed. Wait 10 seconds and try again.
      this.events.emit('disconnected');
      setTimeout(() => {
        this.connect();
      }, 10000);
    });
  }

  /**
   * Gets value from one modbus address.
   * @param {capability} Object with from pollinglist
   * @returns returns number with value.
   */
  readValue(capability) {
    //console.log("Reading value");
    return new Promise((resolve, reject) => {
      if (capability.modbus_item.fc === ModbusModel.ModbusType.COIL) {
        this.client.readCoils(capability.modbus_item.address, 1).then(res => {
          //console.log(res)
          resolve(Boolean(res.response.body.valuesAsArray[0]));
        }).catch(err => {
          reject(err);
        });
      } else if (capability.modbus_item.fc === ModbusModel.ModbusType.HOLDING_REGISTER) {
        this.client.readHoldingRegisters(capability.modbus_item.address, 1).then(res => {
          let value = res.response.body.valuesAsArray[0];
          resolve(Number(value));
        }).catch(err => {
          reject(err);
        });
      } else {
        reject(new Error('Function is not available.'));
      }
    });
  }

  writeSingleCoil(address, value) {
    return new Promise((resolve, reject) => {
      this.client.writeSingleCoil(address, value).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      });
    });
  }

  writeSingleRegister(address, value) {
    return new Promise((resolve, reject) => {
      this.client.writeSingleRegister(address, Number(Math.round(value))).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      })
    })
  }

}

module.exports = ModbusClient;