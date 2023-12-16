
export default class Serial {
  device: USBDevice | null = null;
  interfaceNumber: number = 0;
  endpointIn: number = 0;
  endpointOut: number = 0;
   startTime = new Date();
   endTime = new Date();

end() {
  this.endTime = new Date();
  var timeDiff = this.endTime - this.startTime; //in ms
  // strip the ms

  // get seconds 
  var seconds = Math.round(timeDiff);
  console.log(seconds + " ms");
    this.startTime = new Date();
}
  async getPorts() : Promise<Serial[]> {
    return navigator.usb.getDevices().then((devices) => {
      return devices.map((device) => new Serial(device));
    });
  }

  async requestPort() : Promise<Serial> {
    const filters = [{ vendorId: 0xcafe }]; // TinyUSB
    return navigator.usb.requestDevice({ filters: filters }).then((device) => {
      return new Serial(device);
    });
  }

  constructor(device: USBDevice) {
    this.device = device;
  }

  
  readData() {
      this.device?.transferIn(this.endpointIn, 1024*12).then(
        (result) => {
        this.end();
          this.onReceive(result.data);
        },
        (error) => {
          this.onReceiveError(error);
        }
      );
    
  }

  async connect(): Promise<void>  {

    return this.device
      ?.open()
      .then(() => {
        if (this.device?.configuration === null) {
          return this.device.selectConfiguration(1);
        }
      })
      .then(() => {
        const interfaces = this.device?.configuration?.interfaces;
        interfaces?.forEach((element) => {
          element.alternates.forEach((elementalt) => {
            if (elementalt.interfaceClass == 0xff) {
              this.interfaceNumber = element.interfaceNumber;
              elementalt.endpoints.forEach((elementendpoint) => {
                if (elementendpoint.direction == 'out') {
                  this.endpointOut = elementendpoint.endpointNumber;
                }
                if (elementendpoint.direction == 'in') {
                  this.endpointIn = elementendpoint.endpointNumber;
                }
              });
            }
          });
        });
      })
      .then(() => this.device?.claimInterface(this.interfaceNumber))
      .then(() => this.device?.selectAlternateInterface(this.interfaceNumber, 0))
      .then(() =>
        this.device?.controlTransferOut({
          requestType: 'class',
          recipient: 'interface',
          request: 0x22,
          value: 0x01,
          index: this.interfaceNumber,
        })
      )
      .then(() => {
      });
  }

  disconnect(): Promise<void> | undefined {
    return this.device
      ?.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x00,
        index: this.interfaceNumber,
      })
      .then(() => this.device?.close());
  }

  send(data: Uint8Array): Promise<USBOutTransferResult> | undefined {
    return this.device?.transferOut(this.endpointOut, data);
  }

  onReceive(data: DataView | undefined): void {
    // Handle received data
  }

  onReceiveError(error: Error): void {
    // Handle receive error
  }
}
