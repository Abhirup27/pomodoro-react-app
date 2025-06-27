import {useEffect, useRef, useState} from 'react';
import './App.css';

type Timestamp = {
    state: PomoState;
    time: Date;
    action: 'Start' | 'Resume' | 'Paused' | null;
}
const enum PomoState {
    'init' =  'init',
    'work' =  'work' ,
    'rest' = 'rest' ,
    'finished' =  'finished'  ,
}
type PomodoroClock = {
    startTime: Date | null;
    endTime: Date | null;
    totalTime: number;
    history: Timestamp[];
    cyclesDone: number;
    sessionsDone: number;
}

const DEFAULT_OPTIONS = {
    INTERVAL_DURATION: 25,
    S_BREAK: 5,
    L_BREAK: 15,
    SESSIONS: 4,
    CYCLES: 4,
} as const;
type Settings = {
    cycles: number,
    sessions: number,
    longBreak: number;
    smallBreak: number;
    intervalDuration: number;
    startTime?: Date | null;
    endTime?: Date | null;
}
function App() {
    const [settings, setSettings] = useState<Settings>({
        intervalDuration: DEFAULT_OPTIONS.INTERVAL_DURATION,
        smallBreak: DEFAULT_OPTIONS.S_BREAK,
        longBreak: DEFAULT_OPTIONS.L_BREAK,
        sessions: DEFAULT_OPTIONS.SESSIONS,
        cycles: DEFAULT_OPTIONS.CYCLES,
        startTime: null,
        endTime: null,
    });
    const [progress, setProgress] = useState(0); // Progress from 0 to 100
    const [isActive, setIsActive] = useState(false);
    const [time, setTime] = useState<number>(0);
    const [pomodoroClock, setPomodoroClock] = useState<PomodoroClock>(
        {
            startTime: null, endTime: null,
            history: [{state: PomoState.init, time: new Date(), action: null}],
            cyclesDone: 0, sessionsDone: 0, totalTime: 0,
        }
    );
    const [cycles, setCycles] = useState<number>(DEFAULT_OPTIONS.CYCLES);
    //const startTime = useRef<Date>(null);



    useEffect(() => {
        let interval: number | undefined;

        if(isActive){
            interval = setInterval( ()=> {
                setTime(prevTime => prevTime + 1)
                pomodoroClock.totalTime += 1;
            }, 1000)
        } else if (!isActive && time !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, time]);

    useEffect(() => {

        const currentStateTime = pomodoroClock.sessionsDone > 0 ?
            pomodoroClock.cyclesDone > 0 ?
                (time - (pomodoroClock.sessionsDone * (settings.longBreak *60)) + (pomodoroClock.cyclesDone * settings.smallBreak * 60) + ( pomodoroClock.sessionsDone * (settings.cycles * (settings.smallBreak * 60))))
                : (time - (pomodoroClock.sessionsDone * (settings.longBreak *60)) + ( pomodoroClock.sessionsDone * (settings.cycles * (settings.smallBreak * 60))))
                : pomodoroClock.cyclesDone > 0 ? time - (pomodoroClock.cyclesDone * settings.smallBreak * 60) : time;

        //console.log(pomodoroClock.history[pomodoroClock.history.length - 1].state);

        switch(pomodoroClock.history[pomodoroClock.history.length - 1].state) {
            case PomoState.work:
                if(time >= settings.intervalDuration * 60){
                   pomodoroClock.history.push({ state : PomoState.rest, time: new Date(), action: null });
                   setTime(0);
                   setProgress(0);
                    break;
                }
                setProgress((time/(settings.intervalDuration * 60)) * 100);
                break;
                case PomoState.rest:
                    if(time >= settings.smallBreak * 60){
                        if(pomodoroClock.cyclesDone < settings.cycles){

                            pomodoroClock.history.push({ state : PomoState.work, time: new Date(), action: null });
                            setTime(0);
                            setProgress(0);
                        } else if(pomodoroClock.cyclesDone >= settings.cycles) {
                            pomodoroClock.cyclesDone=0; pomodoroClock.sessionsDone++;
                        }

                        break;
                    }
                    setProgress((time/(settings.smallBreak * 60)) * 100);
                    break;

                    case PomoState.finished:
                        break;
        }


    }, [time])
    const handleChange = () => {
        if(!isActive && time == 0){
            pomodoroClock.startTime = new Date();
            pomodoroClock.history.push({state: PomoState.work, time: pomodoroClock.startTime, action: 'Start'});
        }
        else if(isActive && time > 0){

            const lastState = pomodoroClock.history.length > 0 ? pomodoroClock.history.at(pomodoroClock.history.length - 1)!.state : PomoState.init;

            pomodoroClock.history.push({state: lastState, time: new Date(), action: 'Paused'});
        }
        else if(!isActive && time > 0){
            const lastState = pomodoroClock.history.length > 0 ? pomodoroClock.history.at(pomodoroClock.history.length - 1)!.state : PomoState.init;
            pomodoroClock.history.push({state: lastState, time: new Date(), action: 'Resume'});
        }
        setIsActive(prevState =>  !prevState);
    }

    const updateSettings = (e) => {
        if(!isActive){

            const {name, value} = e.target;
            if(name == 'startTime' ||  name == 'endTime'){
                setSettings({...settings, [name]: new Date(value)});
            }
            else {
                setSettings({...settings, [name]: value});
            }
        }
    }

    const styles = {
        container: {
            maxWidth: 'fit-content',
            margin: '0 auto',
            padding: '20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            color: 'black',
        },
        circleContainer: {
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '20px auto',
        },
        circleBase: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#ecf0f1', // Grey background
        },
        circleProgress: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `conic-gradient(#3498db 0%, #3498db ${progress}%, transparent ${progress}%, transparent 100%)`,
            mask: 'radial-gradient(circle, transparent 50px, black 50px)',
            WebkitMask: 'radial-gradient(circle, transparent 50px, black 50px)',
        },
        progressText: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2c3e50',
        }
    };

    function calcTimeinHHMMSS(){
        const hrs = pomodoroClock.totalTime >= 3600 ? Math.floor(pomodoroClock.totalTime/3600) : 0;
        const mins = pomodoroClock.totalTime % 3600 != 0 ? Math.floor((pomodoroClock.totalTime % 3600)/60) : 0;
        const secs = (pomodoroClock.totalTime % 3600) % 60 != 0 ? Math.floor((pomodoroClock.totalTime % 3600) % 60) : 0;

        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return (
        <div style={styles.container}>
            <h2>Pomodoro Timer</h2>

            {!isActive && <>
                <input type="text" name={"cycles"} value={settings.cycles} onChange={updateSettings} />
                <input type="number" name={"intervalDuration"} value={settings.intervalDuration} onChange={updateSettings} />
                <input type="text" name={"longBreak"} value={settings.longBreak} onChange={updateSettings} />
                <input type="text" name={"smallBreak"} value={settings.smallBreak} onChange={updateSettings} />
                <input type="text" name={"sessions"} value={settings.sessions} onChange={updateSettings} />
                <input type="datetime-local" name={"startTime"} value={settings.startTime?.toISOString().slice(0, 23)} onChange={updateSettings} />
                <input type="datetime-local" disabled={settings.startTime?.toISOString() == null} min={settings.startTime?.toISOString().slice(0, 23)} value={settings.endTime?.toISOString().slice(0, 23)} onChange={updateSettings} />
            </>
            }
            <div style={styles.circleContainer}>

                <div style={styles.circleBase}></div>

                <div style={styles.circleProgress}></div>
                <div style={styles.progressText}>{progress.toFixed(1)}%</div>
            </div>

            <p>{pomodoroClock.history[pomodoroClock.history.length -1 ].state}</p>
            <p>Total time: {calcTimeinHHMMSS()}
            </p>
            {pomodoroClock.history.length>1 ? <p>Start Time: {pomodoroClock.startTime?.getHours()}:{pomodoroClock.startTime?.getMinutes()}:{pomodoroClock.startTime?.getSeconds()}</p>: null }

            <div>

                <button onClick={handleChange}>{ !isActive && time == 0 ? 'Start' : !isActive && time > 0 ? 'Resume' : 'Pause'}</button>
            </div>
        </div>
    );
}

export default App;