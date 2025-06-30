import type {Settings} from "../types.ts";

interface SettingsProp {
    settings: Settings,
    updateSettings: (event: React.ChangeEvent<HTMLInputElement>) => void,
}
function SettingsComp({settings, updateSettings}: SettingsProp) {
    return (
        <div className="settings">
            <h3 className="settings-title">Timer Settings</h3>
            <div className="settings-grid">
                <div className="setting-item">
                    <label>Work Duration (min)</label>
                    <input
                        type="number"
                        name="intervalDuration"
                        value={settings.intervalDuration}
                        onChange={updateSettings}
                        min="1"
                    />
                </div>

                <div className="setting-item">
                    <label>Short Break (min)</label>
                    <input
                        type="number"
                        name="smallBreak"
                        value={settings.smallBreak}
                        onChange={updateSettings}
                        min="1"
                    />
                </div>

                <div className="setting-item">
                    <label>Long Break (min)</label>
                    <input
                        type="number"
                        name="longBreak"
                        value={settings.longBreak}
                        onChange={updateSettings}
                        min="1"
                    />
                </div>

                <div className="setting-item">
                    <label>Cycles per Session</label>
                    <input
                        type="number"
                        name="cycles"
                        value={settings.cycles}
                        onChange={updateSettings}
                        min="1"
                    />
                </div>

                <div className="setting-item">
                    <label>Sessions</label>
                    <input
                        type="number"
                        name="sessions"
                        value={settings.sessions}
                        onChange={updateSettings}
                        min="1"
                    />
                </div>
            </div>
        </div>
    )
}

export default SettingsComp;