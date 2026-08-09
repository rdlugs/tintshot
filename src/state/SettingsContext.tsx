import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { Settings } from "../lib/beautifier.ts";
import { initialSettings, settingsReducer, type Action } from "./settingsReducer.ts";

// State and dispatch live in separate contexts so a panel that only dispatches
// (the option grids, the reset buttons) does not re-render on every slider tick.
const SettingsStateContext = createContext<Settings | null>(null);
const SettingsDispatchContext = createContext<Dispatch<Action> | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, undefined, initialSettings);

  return (
    <SettingsStateContext.Provider value={settings}>
      <SettingsDispatchContext.Provider value={dispatch}>
        {children}
      </SettingsDispatchContext.Provider>
    </SettingsStateContext.Provider>
  );
}

export function useSettings(): Settings {
  const settings = useContext(SettingsStateContext);
  if (!settings) throw new Error("useSettings must be used inside <SettingsProvider>");
  return settings;
}

export function useSettingsDispatch(): Dispatch<Action> {
  const dispatch = useContext(SettingsDispatchContext);
  if (!dispatch) throw new Error("useSettingsDispatch must be used inside <SettingsProvider>");
  return dispatch;
}
