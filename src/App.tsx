import { useEffect, useRef, useState } from 'react';
import './App.css';

// Types and enums
type Timestamp = {
    state: PomoState;
    time: Date;
    action: 'Start' | 'Resume' | 'Paused' | null;
};

enum PomoState {
    INIT = 'init',
    WORK = 'work',
    REST = 'rest',
    FINISHED = 'finished',
}

type PomodoroClock = {
    startTime: Date | null;
    endTime: Date | null;
    totalTime: number;
    history: Timestamp[];
    cyclesDone: number;
    sessionsDone: number;
};

const DEFAULT_SETTINGS = {
    INTERVAL_DURATION: 25,
    S_BREAK: 5,
    L_BREAK: 15,
    SESSIONS: 4,
    CYCLES: 4,
} as const;

type Settings = {
    cycles: number;
    sessions: number;
    longBreak: number;
    smallBreak: number;
    intervalDuration: number;
    startTime?: Date | null;
    endTime?: Date | null;
};

// Helper functions
const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs]
        .map(unit => unit.toString().padStart(2, '0'))
        .join(':');
};

const calculateSessionDuration = (settings: Settings): number => (
    (settings.cycles * settings.intervalDuration * 60) +
    ((settings.cycles - 1) * settings.smallBreak * 60)
);

const ProgressCircle = ({ progress, label }: { progress: number, label: string }) => (
    <div className="circle-container">
        <div className="circle-base" />
        <div
            className="circle-progress"
            style={{
                background: `conic-gradient(#ff6347 0%, #B21807 ${progress}%, transparent ${progress}%, transparent 100%)`
            }}
        />
        <div className="progress-text">
            {progress.toFixed(1)}%
            <div className="progress-label">{label}</div>
        </div>
    </div>
);

function App() {
    // State management
    const [settings, setSettings] = useState<Settings>({
        intervalDuration: DEFAULT_SETTINGS.INTERVAL_DURATION,
        smallBreak: DEFAULT_SETTINGS.S_BREAK,
        longBreak: DEFAULT_SETTINGS.L_BREAK,
        sessions: DEFAULT_SETTINGS.SESSIONS,
        cycles: DEFAULT_SETTINGS.CYCLES,
        startTime: null,
        endTime: null,
    });

    const [progress, setProgress] = useState(0);
    const [sessionProgress, setSessionProgress] = useState(0);
    const [totalProgress, setTotalProgress] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [time, setTime] = useState(0);

    const [pomodoroClock, setPomodoroClock] = useState<PomodoroClock>({
        startTime: null,
        endTime: null,
        history: [{ state: PomoState.INIT, time: new Date(), action: null }],
        cyclesDone: 0,
        sessionsDone: 0,
        totalTime: 0,
    });

    // Refs
    const nextBreak = useRef<number>(0);
    const remainingRest = useRef<number>(0);
    const totalSessionTime = useRef<number>(0);
    // Timer effect
    useEffect(() => {
        let interval: number | undefined;

        if (isActive) {
            interval = setInterval(() => {
                setTime(prev => prev + 1);
                setPomodoroClock(prev => ({ ...prev, totalTime: prev.totalTime + 1 }));
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive]);

    // Session duration calculation
    useEffect(() => {
        if (isActive) {
            totalSessionTime.current = calculateSessionDuration(settings);
        } else {
            nextBreak.current = Date.now() + settings.intervalDuration * 60 * 1000 - time;
        }
    }, [settings, isActive]);

    // Timer logic
    useEffect(() => {
        if (!isActive) return;

        const currentState = pomodoroClock.history.at(-1)?.state || PomoState.INIT;
        const longBreakSec = settings.longBreak * 60;
        const intervalSec = settings.intervalDuration * 60;
        const smallBreakSec = settings.smallBreak * 60;

        const updateTotalProgress = () => {
            setTotalProgress((pomodoroClock.totalTime/((pomodoroClock.endTime!.getTime() - pomodoroClock.startTime!.getTime())/1000)) * 100)
        }
        const updateSessionProgress = () => {
            const completedBlocks = pomodoroClock.sessionsDone *
                (totalSessionTime.current + longBreakSec);
            let timeInSession = pomodoroClock.totalTime - completedBlocks;

            if (timeInSession < 0) timeInSession = 0;

            //cannot go past 100
            const progressValue = Math.min(
                100,
                (timeInSession / totalSessionTime.current) * 100
            );

            setSessionProgress(progressValue);
        };

        switch (currentState) {
            case PomoState.WORK:
                if (time >= intervalSec) {
                    // End work session
                    const newHistory = [
                        ...pomodoroClock.history,
                        { state: PomoState.REST, time: new Date(), action: null }
                    ];

                    setPomodoroClock(prev => ({
                        ...prev,
                        history: newHistory
                    }));

                    nextBreak.current = Date.now() + intervalSec * 1000;
                    setTime(0);
                    setProgress(0);
                    break;
                }

                setProgress((time / intervalSec) * 100);
                updateSessionProgress();
                updateTotalProgress();
                break;

            case PomoState.REST:
                if (pomodoroClock.cyclesDone < settings.cycles - 1) {
                    // Short break logic
                    if (time >= smallBreakSec) {
                        const newHistory = [
                            ...pomodoroClock.history,
                            { state: PomoState.WORK, time: new Date(), action: null }
                        ];

                        setPomodoroClock(prev => ({
                            ...prev,
                            history: newHistory,
                            cyclesDone: prev.cyclesDone + 1
                        }));

                        setTime(0);
                        setProgress(0);
                        break;
                    }

                    setProgress((time / smallBreakSec) * 100);
                    updateSessionProgress();
                    updateTotalProgress();
                    remainingRest.current = smallBreakSec - time;
                    break;
                }
                else {
                    // Long break logic
                    if (pomodoroClock.sessionsDone >= settings.sessions - 1) {

                        setPomodoroClock(prev => ({
                            ...prev,
                            history: [
                                ...prev.history,
                                { state: PomoState.FINISHED, time: new Date(), action: null }
                            ]
                        }));
                        break;
                    }

                    if (time >= longBreakSec) {
                        // End long break
                        setPomodoroClock(prev => ({
                            ...prev,
                            history: [
                                ...prev.history,
                                { state: PomoState.WORK, time: new Date(), action: null }
                            ],
                            cyclesDone: 0,
                            sessionsDone: prev.sessionsDone + 1
                        }));

                        setTime(0);
                        setSessionProgress(0);
                        setProgress(0);
                        break;
                    }

                    setProgress((time / longBreakSec) * 100);
                    setSessionProgress(0);
                    updateTotalProgress();
                    remainingRest.current = longBreakSec - time;
                    break;
                }

            case PomoState.FINISHED:

                break;
        }
    }, [time, isActive, pomodoroClock, settings]);

    // Timer control
    const toggleTimer = () => {
        const sessionDuration = calculateSessionDuration(settings) * 1000;
        const totalDuration = sessionDuration * settings.sessions +
            (settings.sessions - 1) * settings.longBreak * 60 * 1000;

        if (!isActive && time === 0) {

            // Start timer
            const startTime = new Date();

            setPomodoroClock(prev => ({
                ...prev,
                startTime,
                endTime: prev.endTime || new Date(startTime.getTime() + totalDuration),
                history: [
                    ...prev.history,
                    { state: PomoState.WORK, time: startTime, action: 'Start' }
                ]
            }));

            nextBreak.current = Date.now() + settings.intervalDuration * 60 * 1000;
        }
        else if (isActive) {
            // Pause timer
            const currentState = pomodoroClock.history.at(-1)?.state || PomoState.INIT;
            setPomodoroClock(prev => ({
                ...prev,
                history: [
                    ...prev.history,
                    { state: currentState, time: new Date(), action: 'Paused' }
                ]
            }));
        }
        else {
            // Resume timer
            const currentState = pomodoroClock.history.at(-1)?.state || PomoState.INIT;
            const timeShift = Date.now() -
                new Date(pomodoroClock.history.at(-1)?.time || 0).getTime();

            setPomodoroClock(prev => ({
                ...prev,
                history: [
                    ...prev.history,
                    { state: currentState, time: new Date(), action: 'Resume' }
                ],
                endTime: (prev.endTime!.getTime() + timeShift == totalDuration + prev.endTime!.getTime()) ? new Date(prev.endTime!.getTime() + timeShift) : (new Date ( Date.now() + totalDuration - (pomodoroClock.totalTime * 1000)))
            }));

            nextBreak.current += timeShift;
        }

        setIsActive(prev => !prev);
    };

    // Settings update
    const updateSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isActive) return;

        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: name === 'startTime' || name === 'endTime'
                ? new Date(value)
                : Number(value)
        }));
    };

    // Current state helpers
    const currentState = pomodoroClock.history.at(-1)?.state || PomoState.INIT;
    const isWorking = currentState === PomoState.WORK;
    const isResting = currentState === PomoState.REST;
    const isFinished = currentState === PomoState.FINISHED;

    return (
        <div className="app-container">
            <div className="pomodoro-card">
                <h2 className="app-title">🍅 Tomato Timer</h2>

                {!isActive && (
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
                )}

                <div className="progress-section">
                    <div className="progress-circles">
                        <ProgressCircle progress={totalProgress} label="Total" />
                        <ProgressCircle progress={sessionProgress} label="Session" />
                        <ProgressCircle progress={progress} label={isResting ? "Break" : "Current"} />
                    </div>
                </div>

                <div className="timer-info">
                    <div className="info-grid">
                        <div className="info-item">
                            <span>Status:</span>
                            <span className="status-indicator">{currentState}</span>
                        </div>
                        <div className="info-item">
                            <span>Total time:</span>
                            <span className={"info"}>{formatTime(pomodoroClock.totalTime)}</span>
                        </div>
                        <div className="info-item">
                            <span>Completed cycles:</span>
                            <span className={"info"}>{pomodoroClock.cyclesDone}</span>
                        </div>
                        <div className="info-item">
                            <span>Completed sessions:</span>
                            <span className={"info"}>{pomodoroClock.sessionsDone}</span>
                        </div>

                        {isWorking && (
                            <div className="info-item">
                                <span>Next break:</span>
                                <span className={"info"}>{new Date(nextBreak.current).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        )}

                        {isResting && (
                            <div className="info-item">
                                <span>Rest remaining:</span>
                                <span className={"info"}>{formatTime(remainingRest.current)}</span>
                            </div>
                        )}
                        {isWorking || isResting ? ( <div className="info-item">
                            <span>End time:</span>
                            <span className={"info"}>{pomodoroClock.endTime!.toLocaleTimeString()}</span>
                        </div>
                        ) : null}
                    </div>
                </div>

                <div className="controls">
                    <button
                        onClick={toggleTimer}
                        disabled={isFinished}
                        className={`timer-button ${isActive ? 'pause' : 'start'}`}
                    >
                        {!isActive && time === 0 ? 'Start Timer' :
                            !isActive ? 'Resume Timer' : 'Pause Timer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;