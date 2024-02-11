# Ebb/Flow

Connects to the Ebb/Flow System via Modbus TCP for controlling the PLC.

This is just for local/personal use. But made it public if somebody wants a similar thing.


## Reuse as template

If you want to start a new project based on this. The modbus addressing is available under ´´´drivers/controller/modbus/modbus_model.js´´´.
Remove the "devices" from ´´´devices´´´ folder and create a new one. Or save one and build from that. In ´´´driver.js´´´, change the Devicemap to point to your new device.