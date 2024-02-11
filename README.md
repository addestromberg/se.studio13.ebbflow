# Ebb/Flow
Connects Homey as a modbus client to the Ebb/Flow System (my custom hydrophonics system) via Modbus TCP for controlling and overwatch the PLC (Siemens LOGO!).

This is just for local/personal use. But made it public if somebody wants a similar thing or just get an idea of how to do modbus on Homey.

## Reuse as template
If you want to start a new project based on this. The modbus addressing is available under  ```drivers/controller/modbus/modbus_model.js```.
Remove the "devices" from ```devices``` folder and create a new one. Or save one and build from that. In ```driver.js```, change the Devicemap to point to your new device.

### Example of Modbus addressing.

This is the model for different function codes (because my goldfish memory =):
```
const ModbusType = {
  COIL: 1,
  DISCREET_INPUT: 2,
  HOLDING_REGISTER: 3,
  INPUT_REGISTER: 4,
};
```

Example of mapping coils. The app is not read/write aware. You need to take care to what coils and registers that are not writeable etc.
```
    LIGHTS_AUTO: { address: 8256, fc: ModbusType.COIL },
    LIGHTS_ONOFF: { address: 8257, fc: ModbusType.COIL },
    WATERHEATER_AUTO: { address: 8258, fc: ModbusType.COIL },
    WATERHEATER_ONOFF: { address: 8259, fc: ModbusType.COIL },
    AIRHEATER_AUTO: { address: 8260, fc: ModbusType.COIL },
    AIRHEATER_ONOFF: { address: 8261, fc: ModbusType.COIL },
    EXHAUST_AUTO: { address: 8262, fc: ModbusType.COIL },
```

Example of Holding register:
```
  SP_GROWINGLIGHTS_ON: { address: 0, fc: ModbusType.HOLDING_REGISTER },
  SP_GROWINGLIGHTS_OFF: { address: 1, fc: ModbusType.HOLDING_REGISTER },
  SP_WATERTEMP: { address: 2, fc: ModbusType.HOLDING_REGISTER },
  HYST_WATERTEMP: { address: 3, fc: ModbusType.HOLDING_REGISTER },
  SP_AIRTEMP: { address: 4, fc: ModbusType.HOLDING_REGISTER },
```