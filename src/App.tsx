import { useEffect, useState } from 'react';
import './App.css';
import {type BackgroundState, PomoState} from "./types.ts";
import { Controls, Info, ProgressCircle, SettingsComp } from "./components";
import {parseBackgroundState} from "./utils.ts";


function App() {
    const [state, setState] = useState<BackgroundState | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);


    useEffect(() => {
        // Fetch initial state from background
        console.log('fetching initial state');
        chrome.runtime.sendMessage({ action: 'GET_STATE' }).then((value: BackgroundState) => {
            const parsedState = parseBackgroundState(value);
            setState(parsedState);
            setIsInitialized(true);
        });

        // Listen for state updates
        const storageListener = (
            changes: { [key: string]: chrome.storage.StorageChange },
            area: string
        ) => {
            if (area === 'local' && changes.pomodoroState) {

                const parsedState = parseBackgroundState(changes.pomodoroState.newValue);
                console.log('Parsed state:', parsedState);
                setState(parsedState);
            }
        };

        chrome.storage.onChanged.addListener(storageListener);

        return () => {
            chrome.storage.onChanged.removeListener(storageListener);
        };
    }, []);

    const toggleTimer = () => {
        chrome.runtime.sendMessage({ action: 'TOGGLE_TIMER' }).then((value: BackgroundState) => {
            const parsedState = parseBackgroundState(value);
            setState(parsedState);
        });
    };

    const updateSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!state || state.isActive) return;

        const { name, value } = e.target;
        const parsedValue = parseFloat(value);

        if (isNaN(parsedValue)) return;

        const newSettings = {
            ...state.settings,
            [name]: parsedValue
        };

        chrome.runtime.sendMessage({
            action: 'UPDATE_SETTINGS',
            settings: newSettings
        });
    };

    const deleteAllData = () => {
        chrome.runtime.sendMessage({ action: 'DELETE_ALL' });
    };

    if (!isInitialized) return <div className="app-container">Loading...</div>;
    if (!state) return <div className="app-container">Failed to load state</div>;

    const currentState = state.pomodoroClock.history.at(-1)?.state || PomoState.INIT;
    const isWorking = currentState === PomoState.WORK;
    const isResting = currentState === PomoState.REST;
    const isFinished = currentState === PomoState.FINISHED;

    return (
        <div className="app-container">
            <div className="pomodoro-card">
                <h2 className="app-title">🍅 Tomato Timer</h2>
                {!state.isActive && (
                    <>
                        <button onClick={deleteAllData}>Reset All Data</button>
                        <SettingsComp
                            settings={state.settings}
                            {...state.minValues}
                            onChange={updateSettings}
                        />
                    </>
                )}

                <div className="progress-section">
                    <div className="progress-circles">
                        <ProgressCircle progress={state.totalProgress} label="Total" />
                        <ProgressCircle progress={state.sessionProgress} label="Session" />
                        <ProgressCircle
                            progress={state.progress}
                            label={isResting ? "Break" : "Current"}
                        />
                    </div>
                </div>

                <Info
                    pomodoroClock={state.pomodoroClock}
                    currentState={currentState}
                    nextBreak={state.nextBreak}
                    remainingRest={state.remainingRest}
                    isResting={isResting}
                    isWorking={isWorking}
                />

                <Controls
                    time={state.time}
                    toggleTimer={toggleTimer}
                    isActive={state.isActive}
                    isFinished={isFinished}
                />
            </div>
        </div>
    );
}

export default App;