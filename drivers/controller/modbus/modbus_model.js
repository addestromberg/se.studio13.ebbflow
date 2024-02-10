'use strict';

const ModbusType = {
  COIL: 1,
  DISCREET_INPUT: 2,
  HOLDING_REGISTER: 3,
  INPUT_REGISTER: 4,
};

const ModbusModel = {
  ModbusType,
  // Flags (M) (R/W Control binary with these)
  LIGHTS_AUTO: { address: 8256, fc: ModbusType.COIL },
  LIGHTS_ONOFF: { address: 8257, fc: ModbusType.COIL },
  WATERHEATER_AUTO: { address: 8258, fc: ModbusType.COIL },
  WATERHEATER_ONOFF: { address: 8259, fc: ModbusType.COIL },
  AIRHEATER_AUTO: { address: 8260, fc: ModbusType.COIL },
  AIRHEATER_ONOFF: { address: 8261, fc: ModbusType.COIL },
  EXHAUST_AUTO: { address: 8262, fc: ModbusType.COIL },
  EXHAUST_ONOFF: { address: 8263, fc: ModbusType.COIL },
  AIRMIXERS_AUTO: { address: 8264, fc: ModbusType.COIL },
  AIRMIXERS_ONOFF: { address: 8265, fc: ModbusType.COIL },
  EFA_AUTO: { address: 8266, fc: ModbusType.COIL },
  FLOWPUMP_A_ONOFF: { address: 8267, fc: ModbusType.COIL },
  DUMPVALVE_A_OPENCLOSE: { address: 8268, fc: ModbusType.COIL },
  EFB_AUTO: { address: 8269, fc: ModbusType.COIL },
  FLOWPUMP_B_ONOFF: { address: 8270, fc: ModbusType.COIL },
  DUMPVALVE_B_OPENCLOSE: { address: 8271, fc: ModbusType.COIL },
  
  // Outputs (Can but should not write directly)
  GROWLIGHTS_OUTPUT: { address: 8192, fc: ModbusType.COIL },
  AIRHEATER_OUTPUT: { address: 8193, fc: ModbusType.COIL },
  WATERHEATER_OUTPUT: { address: 8194, fc: ModbusType.COIL },
  EXHAUST_OUTPUT: { address: 8195, fc: ModbusType.COIL },
  AIRMIXERS_OUTPUT: { address: 8196, fc: ModbusType.COIL },
  FLOWPUMP_A_OUTPUT: { address: 8197, fc: ModbusType.COIL },
  DUMPVALVE_A_OUTPUT: { address: 8198, fc: ModbusType.COIL },
  FLOWPUMP_B_OUTPUT: { address: 8199, fc: ModbusType.COIL },
  DUMPVALVE_B_OUTPUT: { address: 8200, fc: ModbusType.COIL },

  // Analog in (Read only)
  BUFFERTEMP_INPUT: { address: 0, fc: ModbusType.INPUT_REGISTER },
  AIRTEMP_INPUT: { address: 1, fc: ModbusType.INPUT_REGISTER },
  AIRHUMIDITY_INPUT: { address: 2, fc: ModbusType.INPUT_REGISTER },
  BUFFERLEVEL_INPUT: { address: 3, fc: ModbusType.INPUT_REGISTER },

  // Variable Memory INPUTS (Holding Registers). Mapping to Math blocks.
  SP_GROWINGLIGHTS_ON: { address: 0, fc: ModbusType.HOLDING_REGISTER },
  SP_GROWINGLIGHTS_OFF: { address: 1, fc: ModbusType.HOLDING_REGISTER },
  SP_WATERTEMP: { address: 2, fc: ModbusType.HOLDING_REGISTER },
  HYST_WATERTEMP: { address: 3, fc: ModbusType.HOLDING_REGISTER },
  SP_AIRTEMP: { address: 4, fc: ModbusType.HOLDING_REGISTER },
  HYST_AIRTEMP: { address: 5, fc: ModbusType.HOLDING_REGISTER },
  SP_HUMIDITY: { address: 6, fc: ModbusType.HOLDING_REGISTER },
  HYST_HUMIDITY: { address: 7, fc: ModbusType.HOLDING_REGISTER },
  BUFFER_H_LEVEL: { address: 8, fc: ModbusType.HOLDING_REGISTER },
  BUFFER_L_LEVEL: { address: 9, fc: ModbusType.HOLDING_REGISTER },
  BUFFER_LL_LEVEL: { address: 10, fc: ModbusType.HOLDING_REGISTER },
  EFA_FLOOD_TIME: { address: 11, fc: ModbusType.HOLDING_REGISTER },
  EFA_FLOW_TIME: { address: 12, fc: ModbusType.HOLDING_REGISTER },
  EFA_EBB_TIME: { address: 13, fc: ModbusType.HOLDING_REGISTER },
  EFA_DRAIN_TIME: { address: 14, fc: ModbusType.HOLDING_REGISTER },
  EFB_FLOOD_TIME: { address: 15, fc: ModbusType.HOLDING_REGISTER },
  EFB_FLOW_TIME: { address: 16, fc: ModbusType.HOLDING_REGISTER },
  EFB_EBB_TIME: { address: 17, fc: ModbusType.HOLDING_REGISTER },
  EFB_DRAIN_TIME: { address: 18, fc: ModbusType.HOLDING_REGISTER },
  AIR_TEMP: { address: 19, fc: ModbusType.HOLDING_REGISTER },
  WATER_TEMP: { address: 20, fc: ModbusType.HOLDING_REGISTER },

};

/**
 * Seems to be offset by -1
 * 
 * Siemens LOGO Modbus Addressing
 * Type   Range       Modbus Address    Direction   Unit
 * I      1-24        DI 1-24           R           bit
 * Q      1-20        Coil 8193-8212    R/W         bit
 * M      1-64        Coil 8257-8320    R/W         bit
 * V      0.0-850.7   Coil 1-6808       R/W         bit
 * AI     1-8         IR 1-8            R           word
 * VW     0-848       HR 1-425          R/W         word
 * AQ     1-8         HR 513-520        R/W         word
 * AM     1-64        HR 529-592        R/W         word
 */

module.exports = ModbusModel;