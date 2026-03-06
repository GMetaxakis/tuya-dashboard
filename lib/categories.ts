export const CATEGORIES: Record<string, string> = {
  pc: "Socket", kg: "Switch", wk: "Thermostat", dj: "Light",
  sp: "Camera", cs: "Dehumidifier", kqzg: "Air Purifier", cwwsq: "Pet Feeder",
  hps: "Presence Sensor", wsdcg: "T&H Sensor", tdq: "T&H Sensor", wg2: "BLE Gateway",
  wnykq: "IR Remote", qt: "IR Sub-device", dcb: "Smart Battery", zwjcy: "Plant Sensor",
};

export function categoryLabel(code: string): string {
  return CATEGORIES[code] || code;
}
