"use client";

import { DP } from "./types";
import SocketPanel from "./SocketPanel";
import SwitchPanel from "./SwitchPanel";
import ThermostatPanel from "./ThermostatPanel";
import LightPanel from "./LightPanel";
import AirPurifierPanel from "./AirPurifierPanel";
import DehumidifierPanel from "./DehumidifierPanel";
import SensorPanel from "./SensorPanel";
import PresencePanel from "./PresencePanel";
import GenericPanel from "./GenericPanel";

const PANEL_MAP: Record<string, React.ComponentType<{ deviceId: string; dps: DP[]; onRefresh: () => void }>> = {
  pc: SocketPanel,
  kg: SwitchPanel,
  wk: ThermostatPanel,
  dj: LightPanel,
  kqzg: AirPurifierPanel,
  cwwsq: AirPurifierPanel,  // pet feeder uses similar controls
  cs: DehumidifierPanel,
  wsdcg: SensorPanel,
  tdq: SensorPanel,
  zwjcy: SensorPanel,       // plant sensor
  hps: PresencePanel,
};

export default function ControlPanel({
  category,
  deviceId,
  dps,
  onRefresh,
}: {
  category: string;
  deviceId: string;
  dps: DP[];
  onRefresh: () => void;
}) {
  const Panel = PANEL_MAP[category] || GenericPanel;
  return <Panel deviceId={deviceId} dps={dps} onRefresh={onRefresh} />;
}
