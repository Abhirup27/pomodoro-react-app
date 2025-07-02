import type {Settings} from "../types.ts";
import SettingItem from "./SettingItem.tsx";

interface SettingsProp {
    settings: Settings,
    // These props are passed to prevent the user from setting a value lower than the amount that is already spent in a current state.
    // If for example the state is "work" and 5 minutes have gone, then the user should not be able to set a value less than 5.
    minInterval?: number,
    minSRest?: number,
    minLRest?: number,
    minCycles: number,
    minSessions: number,
    [key: string ] : number| undefined |Settings | {(e: React.ChangeEvent<HTMLInputElement>): void}
    //onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
}
function SettingsComp({settings,minInterval,minSRest,minLRest, minCycles, minSessions, ...props}: SettingsProp) {
    return (
        <div className="settings">
            <h3 className="settings-title">Timer Settings</h3>
            <div className="settings-grid">
                {/*{...props} is same as onChange={onChange}*/}
                <SettingItem name={"intervalDuration"} value={settings.intervalDuration } min={minInterval ?? 1} {...props} >Work Duration (min)</SettingItem>
                <SettingItem name={"smallBreak"} value={settings.smallBreak} min={minSRest ?? 1} {...props} >Short Break (min)</SettingItem>
                <SettingItem name={"longBreak"} value={settings.longBreak} min={minLRest ?? 1} {...props} >Long Break (min)</SettingItem>
                <SettingItem name={"cycles"} value={settings.cycles} min={minCycles ?? 1} {...props} >Cycles per Session</SettingItem>
                <SettingItem name={"sessions"} value={settings.sessions} min={minSessions ?? 1} {...props}>Sessions</SettingItem>
            </div>
        </div>
    )
}

export default SettingsComp;