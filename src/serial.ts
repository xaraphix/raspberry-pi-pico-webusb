import { debounce, throttle } from 'lodash';
import {
	chunkSizeInBytes,
	maxSpeed,
	performanceData,
	queryTimeInMs,
	speedInKBps
} from './stores/store';

export default class Serial {
	device: USBDevice | null = null;
	interfaceNumber: number = 0;
	endpointIn: number = 0;
	endpointOut: number = 0;
	startTime: Date = new Date();
	endTime: Date = new Date();
	performanceData: Record<number, Record<number, PerformanceCell>> | null = null;
	prevChunkSize = 0;
	prevQueryTime = 0;
	chunkSizeInBytes = 0;
	queryTimeInMs: number = 0;
	maxSpeed: Maxspeed | null = null;

	updateSpeed = throttle((ms: number, chunkSize: number, queryTime: number) => {
		if (this.queryTimeInMs === 0 || this.chunkSizeInBytes === 0) {
			speedInKBps.set(0);
			return;
		}

		console.log('Time: ', ms, 'QTime', queryTime);
		const speed = (chunkSize * 1000.0) / (1024 * ms);

		if (speed > 1536) {
			return;
		}

		if (this.performanceData) {
			if (this.prevChunkSize === chunkSize && this.prevQueryTime === queryTime) {
				this.performanceData[chunkSize][queryTime].completed = false;
				this.performanceData[chunkSize][queryTime].started = true;
			} else if (this.prevChunkSize != 0 && this.prevChunkSize != 0) {
				this.performanceData[this.prevChunkSize][this.prevQueryTime].completed = true;
			}
			this.performanceData[chunkSize][queryTime].currentSpeed = speed;

			if (this.performanceData[chunkSize][queryTime].maxSpeed < speed) {
				this.performanceData[chunkSize][queryTime].maxSpeed = speed;
			}
			performanceData.set(this.performanceData);
		}

		if (!this.maxSpeed || this.maxSpeed.speed < speed) {
			maxSpeed.set({
				speed,
				queryTime: queryTime,
				chunkSizeInBytes: chunkSize
			});
		}
		speedInKBps.set(speed);
	}, 300);

	end(startTime: Date, endTime: Date, chunkSize: number, queryTime: number) {
		const timeDiff: number = endTime.getTime() - startTime.getTime(); //in ms
		const ms = Math.round(timeDiff);

		this.updateSpeed(ms, chunkSize, queryTime);
	}

	async getPorts(): Promise<Serial[]> {
		return navigator.usb.getDevices().then((devices) => {
			return devices.map((device) => new Serial(device));
		});
	}

	async requestPort(): Promise<Serial> {
		const filters = [{ vendorId: 0xcafe }]; // TinyUSB
		return navigator.usb.requestDevice({ filters: filters }).then((device) => {
			return new Serial(device);
		});
	}

	constructor(device: USBDevice) {
		this.device = device;
		chunkSizeInBytes.subscribe((v) => (this.chunkSizeInBytes = v));
		maxSpeed.subscribe((v) => (this.maxSpeed = v));
		queryTimeInMs.subscribe((v) => (this.queryTimeInMs = v));
		performanceData.subscribe((v) => (this.performanceData = v));
	}

	readData(chunkSize: number, queryTime: number) {
		const startTime = new Date();
		this.device
			?.transferIn(this.endpointIn, chunkSize)
			.then(
				(result) => {
					const endTime = new Date();
					this.end(startTime, endTime, chunkSize, queryTime);
					this.onReceive(result.data);
				},
				(error) => {
					this.onReceiveError(error);
				}
			)
			.catch((error) => {
				this.onReceiveError(error);
			});
	}

	async connect(): Promise<void> {
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
			.then(
				() =>
					this.device?.controlTransferOut({
						requestType: 'class',
						recipient: 'interface',
						request: 0x22,
						value: 0x01,
						index: this.interfaceNumber
					})
			)
			.then(() => {});
	}

	disconnect(): Promise<void> | undefined {
		return this.device
			?.controlTransferOut({
				requestType: 'class',
				recipient: 'interface',
				request: 0x22,
				value: 0x00,
				index: this.interfaceNumber
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
