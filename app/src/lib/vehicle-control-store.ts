import {
  DEFAULT_VEHICLE_CONTROL_STATE,
  type TurnDirection,
  type VehicleControlState,
} from "@/lib/vehicle-control";

type StoreShape = {
  state: VehicleControlState;
};

declare global {
  // eslint-disable-next-line no-var
  var __vehicleControlStore: StoreShape | undefined;
}

function getStore(): StoreShape {
  if (!globalThis.__vehicleControlStore) {
    globalThis.__vehicleControlStore = {
      state: { ...DEFAULT_VEHICLE_CONTROL_STATE },
    };
  }

  return globalThis.__vehicleControlStore;
}

export function getVehicleControlState(): VehicleControlState {
  return { ...getStore().state };
}

export function setBrake(on: boolean): VehicleControlState {
  const store = getStore();
  store.state.brakeOn = on;

  if (on) {
    store.state.turnDirection = null;
  }

  return getVehicleControlState();
}

export function setHighbeam(on: boolean): VehicleControlState {
  const store = getStore();
  store.state.highbeamOn = on;

  if (on) {
    store.state.lowbeamOn = false;
  }

  return getVehicleControlState();
}

export function setLowbeam(on: boolean): VehicleControlState {
  const store = getStore();
  store.state.lowbeamOn = on;

  if (on) {
    store.state.highbeamOn = false;
  }

  return getVehicleControlState();
}

export function setTurnDirection(direction: TurnDirection): VehicleControlState {
  const store = getStore();
  store.state.turnDirection = direction;

  if (direction) {
    store.state.brakeOn = false;
  }

  return getVehicleControlState();
}

