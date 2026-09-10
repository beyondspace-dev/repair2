import { logger } from "../logs/logger";

let SerialPortClass: typeof import("serialport").SerialPort | null = null;

async function getSerialPort() {
  if (!SerialPortClass) SerialPortClass = (await import("serialport")).SerialPort;

  return SerialPortClass;
}

type SerialDataHandler = (data: string) => void;
type SerialConnectHandler = (port: string) => void;

export default class SerialConnector {
  port: import("serialport").SerialPort | null = null;

  constructor(
    private readonly getDefaultPath: () => Promise<string | null>,
    private readonly ondata: SerialDataHandler,
    private readonly onconnect: SerialConnectHandler
  ) {}

  async open(portAlias?: string, path?: string | null, baudRate = 9600) {
    if (this.port?.isOpen) this.port.close();

    const SP = await getSerialPort();

    if (!portAlias && !path) {
      path = await this.getDefaultPath();
      if (!path) portAlias = "USB-SERIAL";
    }

    if (!path) {
      const list = await SP.list();
      path = list.find((port) => port.friendlyName?.includes?.(portAlias))?.path;
    }

    if (!path) return;

    this.port = new SP({
      path,
      baudRate: baudRate
    });

    logger.info("SERIAL OPENED: ", path);
    this.onconnect(path);

    this.port.on("readable", () => {
      const data = this.port?.read();
      if (!data) return;
      this.ondata(data.toString().trim());
    });
  }

  send(data: unknown) {
    if (!this.port) {
      logger.warning("SerialPort", "No port connection");
      return;
    }
    this.port.write(String(data));
  }

  close() {
    if (!this.port || !this.port.isOpen) return;
    this.port.close();
    this.port = null;
  }
}
