export type TurnDirection = "left" | "right" | null;

export type VehicleControlState = {
  brakeOn: boolean;
  highbeamOn: boolean;
  lowbeamOn: boolean;
  turnDirection: TurnDirection;
};

export const DEFAULT_VEHICLE_CONTROL_STATE: VehicleControlState = {
  brakeOn: false,
  highbeamOn: false,
  lowbeamOn: false,
  turnDirection: null,
};

