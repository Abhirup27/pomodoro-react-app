//let timerActive: boolean = false;
enum PomoState {
    INIT = 'init',
    WORK = 'work',
    REST = 'rest',
    FINISHED = 'finished',
}
let timerInterval: number | undefined;
const state = {
    time: 0,
    progress: 0,
    sessionProgress: 0,
    totalProgress: 0,
    isActive: false,
    totalSessionTime: 0,
    pomodoroClock: {
        startTime: null as Date | null,
        endTime: null as Date | null,
        history: [{ state: "INIT", time: new Date(), action: null }],
        cyclesDone: 0,
        sessionsDone: 0,
        totalTime: 0,
    },
    settings: {
        intervalDuration: 25,
        smallBreak: 5,
        longBreak: 15,
        sessions: 4,
        cycles: 4,
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
chrome.storage.local.get('pomodoroState', (data) => {
    if (data.pomodoroState) {
        Object.assign(state, data.pomodoroState);
        if (state.isActive) startTimer();
    }
});

function startTimer() {
    timerInterval = setInterval(() => {
        state.time++;
        state.pomodoroClock.totalTime++;
        updateProgress();
        saveState();
    }, 1000);
}

function updateProgress() {
    const currentState = state.pomodoroClock.history.at(-1)?.state || PomoState.INIT;
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
                    state.pomodoroClock.sessionsDone = state.pomodoroClock.sessionsDone + 1;

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
        // Add case for FINISHED states
        default:
            break;
    }
}

function saveState() {
    chrome.storage.local.set({ pomodoroState: state });
}
const calculateSessionDuration = (): number => (
    (state.settings.cycles * state.settings.intervalDuration * 60) +
    ((state.settings.cycles - 1) * state.settings.smallBreak * 60)
);
chrome.runtime.onMessage.addListener((request, _sender, sendResponse: (response?: object) => void) => {
    switch (request.action) {
        case 'TOGGLE_TIMER':
            state.isActive = !state.isActive;
            if (state.isActive) {
                // Initialize timer if starting
                if (state.time === 0) {
                    state.pomodoroClock.startTime = new Date();
                    state.totalSessionTime = calculateSessionDuration() * 1000;
                    // ... other initialization
                }
                startTimer();
            } else {
                clearInterval(timerInterval);
            }
            saveState();
            sendResponse(state);
            break;

        case 'UPDATE_SETTINGS':
            Object.assign(state.settings, request.settings);
            console.log(request.settings);
            saveState();
            sendResponse(state);
            break;

        case 'GET_STATE':
            sendResponse(state);
            break;
    }
    return true;
});

chrome.runtime.onSuspend.addListener(() => {
    saveState();
});
