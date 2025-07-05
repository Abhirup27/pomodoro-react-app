//let timerActive: boolean = false;
import {PomoState, type PomodoroClock, type Settings, type BackgroundState} from "../types.ts";
import {DEFAULT_SETTINGS} from "../utils.ts";

let timerInterval: number | undefined;
let state: BackgroundState = {
    time: 0,
    progress: 0,
    sessionProgress: 0,
    totalProgress: 0,
    isActive: false,
    totalSessionTime: 0,
    pomodoroClock: {
        startTime: null,
        endTime: null,
        history: [{ state: PomoState.INIT, time: new Date(), action: null }],
        cyclesDone: 0,
        sessionsDone: 0,
        totalTime: 0,
    },
    settings: {
        intervalDuration: DEFAULT_SETTINGS.INTERVAL_DURATION,
        smallBreak: DEFAULT_SETTINGS.S_BREAK,
        longBreak: DEFAULT_SETTINGS.L_BREAK,
        sessions: DEFAULT_SETTINGS.SESSIONS,
        cycles: DEFAULT_SETTINGS.CYCLES,
        startTime: null,
        endTime: null,
    },
    nextBreak: 0,
    remainingRest: 0,
    minValues: {
        minInterval: 1,
        minSRest: 1,
        minLRest: 1,
        minCycles: 1,
        minSessions: 1,
    }
};


// Load saved state
chrome.storage.local.get('pomodoroState', (data: { [p: string]: BackgroundState}) => {

    if (data.pomodoroState) {
        Object.assign(state, data.pomodoroState);
        if (state.isActive) startTimer();
    } else {
        state = initState();
    }
});

function startTimer() {
    timerInterval = setInterval(() => {
        if( !state.isActive ) return;
        state.time++;
        state.pomodoroClock.totalTime++;
        updateProgress();
        saveState();
    }, 1000);
}

function updateProgress() {
    const currentState = state.pomodoroClock.history.at(-1)?.state || PomoState.INIT;
    console.log(currentState);
    const longBreakSec = state.settings.longBreak * 60;
    const intervalSec = state.settings.intervalDuration * 60;
    const smallBreakSec = state.settings.smallBreak * 60;

    const updateTotalProgress = () => {
        if (!state.pomodoroClock.startTime || !state.pomodoroClock.endTime) return;
        const totalSeconds = (state.pomodoroClock.endTime.getTime() - state.pomodoroClock.startTime.getTime()) / 1000;
        state.totalProgress = (state.pomodoroClock.totalTime / totalSeconds) * 100;
    };

    const updateSessionProgress = () => {
        const completedBlocks = state.pomodoroClock.sessionsDone *
            (state.totalSessionTime + longBreakSec);
        let timeInSession = state.pomodoroClock.totalTime - completedBlocks;
        if (timeInSession < 0) timeInSession = 0;
        state.sessionProgress = Math.min(100, (timeInSession / state.totalSessionTime) * 100);
    };

    switch (currentState) {
        case PomoState.WORK:
            if (state.time >= intervalSec) {
                state.pomodoroClock.history.push({ state: PomoState.REST, time: new Date(), action: null });
                state.time = 0;
                state.nextBreak = Date.now() + intervalSec * 1000;
                state.minValues.minInterval = 1;
                state.progress = 0;

            }
           // console.log('this ran');
            state.progress = (state.time / intervalSec) * 100;
            state.minValues.minInterval = state.time / 60;
            updateSessionProgress();
            updateTotalProgress();
            break;
        case PomoState.REST:
            if (state.pomodoroClock.cyclesDone < state.settings.cycles - 1) {
                // Short break logic
                if (state.time >= smallBreakSec) {
                    state.pomodoroClock.history.push({ state: PomoState.WORK, time: new Date(), action: null });

                    state.nextBreak = Date.now() + state.settings.intervalDuration * 60 * 1000;
                    state.minValues.minCycles++;
                    state.time = 0;
                    state.minValues.minSRest = 1;
                    state.progress = 0;
                    break;
                }

                state.progress = ((state.time / smallBreakSec) * 100);
                state.minValues.minSRest = state.time/60;
                updateSessionProgress();
                updateTotalProgress();
                state.remainingRest = smallBreakSec - state.time;
                break;
            }
            else {
                // Long break logic
                if (state.pomodoroClock.sessionsDone >= state.settings.sessions - 1) {

                    state.pomodoroClock.history.push({ state: PomoState.FINISHED, time: new Date(), action: null });
                    break;
                }

                if (state.time >= longBreakSec) {
                    // End long break
                    state.pomodoroClock.history.push({ state: PomoState.WORK, time: new Date(), action: null });
                    state.pomodoroClock.cyclesDone = 0;
                    state.pomodoroClock.sessionsDone++;

                    state.minValues.minCycles = 1;
                    state.minValues.minSessions++;
                    state.time = 0;
                    state.minValues.minLRest = 1;
                    state.sessionProgress = 0;
                    state.progress = 0;
                    break;
                }

                //setProgress((time / longBreakSec) * 100);
                state.progress = (state.time/ longBreakSec) * 100;
                state.minValues.minLRest = state.time/60;
                state.sessionProgress = 0;
                updateTotalProgress();
                updateSessionProgress();
                state.remainingRest = longBreakSec - state.time;
                break;
            }
        case PomoState.FINISHED:
            clearInterval(timerInterval);
            state.isActive = false;
            break;
        default:

            break;
    }
}

function saveState() {
    console.log(state);
    chrome.storage.local.set({ pomodoroState: state });
}
function deleteAll() {
    chrome.storage.local.clear();
}
const calculateSessionDuration = (): number => (
    (state.settings.cycles * state.settings.intervalDuration * 60) +
    ((state.settings.cycles - 1) * state.settings.smallBreak * 60)
);

function initState() : {pomodoroClock: PomodoroClock, settings: Settings, isActive: boolean, time: number, totalSessionTime: number, progress: number, sessionProgress: number, totalProgress: number, nextBreak: number, remainingRest: number, minValues: {minInterval: number, minSRest: number, minLRest: number, minCycles: number, minSessions: number}} {
    return {
        pomodoroClock: {
            startTime: null,
            endTime: null,
            history: [{ state: PomoState.INIT, time: new Date(), action: null }],
            cyclesDone: 0,
            sessionsDone: 0,
            totalTime: 0,
        },
        minValues: {minCycles: 0, minInterval: 0, minLRest: 0, minSRest: 0, minSessions: 0},
        nextBreak: 0,
        progress: 0,
        remainingRest: 0,
        sessionProgress: 0,
        totalProgress: 0,
        isActive: false,
        time: 0,
        totalSessionTime: 0,
        settings: {
            intervalDuration: DEFAULT_SETTINGS.INTERVAL_DURATION,
            smallBreak: DEFAULT_SETTINGS.S_BREAK,
            longBreak: DEFAULT_SETTINGS.L_BREAK,
            sessions: DEFAULT_SETTINGS.SESSIONS,
            cycles: DEFAULT_SETTINGS.CYCLES,
            startTime: null,
            endTime: null,
        }
    };
}
function toggleTimer() {
    const sessionDuration = calculateSessionDuration() * 1000;
    const totalDuration = sessionDuration * state.settings.sessions + ((state.settings.longBreak * 60 * 1000) * (state.settings.sessions -1));
        // Initialize timer if starting
        if (state.time === 0 && !(state.isActive)) {
            console.log('in init');
            state.pomodoroClock.startTime = new Date();
            state.totalSessionTime = calculateSessionDuration();
            state.pomodoroClock.history.push({ state: PomoState.WORK, time: new Date(), action: null });
            state.pomodoroClock.endTime = new Date(state.pomodoroClock.startTime.getTime() + totalDuration);
            state.nextBreak = Date.now() + state.settings.intervalDuration * 60 * 1000;
            console.log('saving state')
            startTimer();
            // ... other initialization
        } else if (state.isActive){
            const currentState = state.pomodoroClock.history.at(-1)?.state || PomoState.INIT;
            state.pomodoroClock.history.push({ state: currentState, time: new Date(), action: null });
        } else {
            state.totalSessionTime = calculateSessionDuration();
            const currentState = state.pomodoroClock.history.at(-1)?.state || PomoState.INIT;
            const timeShift = Date.now() - new Date(state.pomodoroClock.history.at(-1)!.time).getTime();
            state.pomodoroClock.history.push({ state: currentState,
                time: (state.pomodoroClock.endTime!.getTime() + timeShift == totalDuration + state.pomodoroClock.endTime!.getTime()) ? new Date(state.pomodoroClock.endTime!.getTime() + timeShift) : (new Date(Date.now() + totalDuration - (state.pomodoroClock.totalTime * 1000))),
                action: null });
            if(currentState === PomoState.WORK) {
                state.nextBreak = state.nextBreak + timeShift;
            }
            saveState();
        }

    state.isActive = !state.isActive;

    //clearInterval(timerInterval);
}
chrome.runtime.onMessage.addListener((request, _sender, sendResponse: (response?: object) => void) => {
    switch (request.action) {
        case 'TOGGLE_TIMER':
            toggleTimer();
            sendResponse(state);
            break;

        case 'UPDATE_SETTINGS':
            console.log('in update settings');
            Object.assign(state.settings, request.settings);

            saveState();
            sendResponse(state);
            break;

        case 'GET_STATE':
            console.log('in get state');
            sendResponse(state);
            break;

        case 'DELETE_ALL':
            state = initState();
            deleteAll();
            break;
    }
    return true;
});

chrome.runtime.onSuspend.addListener(() => {
    console.log('onSuspend');
    saveState();
});
