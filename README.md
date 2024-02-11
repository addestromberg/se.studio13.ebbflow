# Ebb/Flow

Connects to the Ebb/Flow System via Modbus TCP for controlling the PLC.

This is just for local/personal use. But made it public if somebody wants a similar thing.


## Reuse as template

If you want to start a new project based on this. The modbus addressing is available under  ```drivers/controller/modbus/modbus_model.js```.
Remove the "devices" from ```devices`` folder and create a new one. Or save one and build from that. In ```driver.js```, change the Devicemap to point to your new device.

### Example of Modbus addressing.

```
const ModbusType = {
  COIL: 1,
  DISCREET_INPUT: 2,
  HOLDING_REGISTER: 3,
  INPUT_REGISTER: 4,
};

LIGHTS_AUTO: { address: 8256, fc: ModbusType.COIL },
LIGHTS_ONOFF: { address: 8257, fc: ModbusType.COIL },
WATERHEATER_AUTO: { address: 8258, fc: ModbusType.COIL },
WATERHEATER_ONOFF: { address: 8259, fc: ModbusType.COIL },
AIRHEATER_AUTO: { address: 8260, fc: ModbusType.COIL },
AIRHEATER_ONOFF: { address: 8261, fc: ModbusType.COIL },
EXHAUST_AUTO: { address: 8262, fc: ModbusType.COIL },
EXHAUST_ONOFF: { address: 8264, fc: ModbusType.COIL },
AIRMIXERS_AUTO: { address: 8265, fc: ModbusType.COIL },
AIRMIXERS_ONOFF: { address: 8266, fc: ModbusType.COIL },
EFA_AUTO: { address: 8267, fc: ModbusType.COIL },
FLOWPUMP_A_ONOFF: { address: 8268, fc: ModbusType.COIL },
DUMPVALVE_A_OPENCLOSE: { address: 8269, fc: ModbusType.COIL },
EFB_AUTO: { address: 8270, fc: ModbusType.COIL },
FLOWPUMP_B_ONOFF: { address: 8271, fc: ModbusType.COIL },
DUMPVALVE_B_OPENCLOSE: { address: 8272, fc: ModbusType.COIL }
```
