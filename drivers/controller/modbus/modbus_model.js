'use strict';

const ModbusType = {
  COIL: 1,
  DISCREET_INPUT: 2,
  HOLDING_REGISTER: 3,
  INPUT_REGISTER: 4,
};

const ModbusModel = {
  ModbusType,
  UNIT_ON: { address: 1, fc: ModbusType.COIL },
};

module.exports = ModbusModel;