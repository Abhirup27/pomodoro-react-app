import {useEffect, useRef, useState} from 'react';
import './App.css';
import {type PomodoroClock, PomoState, type Settings} from "./types.ts";
import {Controls, Info, ProgressCircle, SettingsComp} from "./components";
import {calculateSessionDuration, DEFAULT_SETTINGS} from "./utils.ts";

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
                    {state: currentState, time: new Date(), action: 'Resume'}
                ],
                endTime: (prev.endTime!.getTime() + timeShift == totalDuration + prev.endTime!.getTime()) ? new Date(prev.endTime!.getTime() + timeShift) : (new Date(Date.now() + totalDuration - (pomodoroClock.totalTime * 1000)))
            }));
            if (currentState == PomoState.WORK) {
                 console.log(nextBreak.current + timeShift == (settings.intervalDuration *60) - time + timeShift)
                nextBreak.current = nextBreak.current + timeShift;
             }
        }
        setIsActive(prev => !prev);
    };

    // Settings update
    const updateSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isActive) return;

        const { name, value } = e.target;
        console.log(value);
        let validatedValue : number;
        //validate data
        switch (name) {
            case 'intervalDuration':
                if(currentState === PomoState.WORK){
                    validatedValue =  Math.max((time/60), parseFloat(value));
                    console.log(validatedValue);
                    break;
                }
                validatedValue = parseInt(value, 10);
                break;
            case 'smallBreak':
                if(currentState === PomoState.REST && pomodoroClock.cyclesDone < settings.cycles){
                    validatedValue =  Math.max((time/60), parseFloat(value));
                    break;
                }
                validatedValue = parseInt(value, 10);
                break;
            case 'longBreak':
                if(currentState === PomoState.REST && pomodoroClock.cyclesDone >= settings.cycles) {
                    validatedValue =  Math.max((time/60), parseFloat(value));
                    break;
                }
                validatedValue = parseInt(value, 10);
                break;
            case 'cycles':
                validatedValue =  Math.max(pomodoroClock.cyclesDone, parseInt(value, 10));
                break;
            case 'sessions':
                validatedValue = Math.max(pomodoroClock.sessionsDone, parseInt(value, 10));
                break;
            case 'startTime':
                break;
            case 'endTime':
                 break;
            default:
                validatedValue = parseInt(value, 10);
                break;
        }
        console.log(validatedValue);
        setSettings(prev => ({
            ...prev,
            [name]: name === 'startTime' || name === 'endTime'
                ? new Date(value)
                :  validatedValue  }));
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

                {!isActive && <SettingsComp settings={settings} onChange={updateSettings} minInterval={currentState == PomoState.WORK ? (time/60) : undefined}/>}

                <div className="progress-section">
                    <div className="progress-circles">
                        <ProgressCircle progress={totalProgress} label="Total" />
                        <ProgressCircle progress={sessionProgress} label="Session" />
                        <ProgressCircle progress={progress} label={isResting ? "Break" : "Current"} />
                    </div>
                </div>

                {<Info pomodoroClock={pomodoroClock} currentState={currentState} nextBreak={nextBreak.current} remainingRest={remainingRest.current} isResting={isResting} isWorking={isWorking} />}
                {<Controls time={time} toggleTimer={toggleTimer} isActive={isActive} isFinished={isFinished}/>}

            </div>
        </div>
    );
}

export default App;