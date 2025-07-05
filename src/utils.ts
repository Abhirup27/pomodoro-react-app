import type {BackgroundState, Settings, Timestamp} from "./types.ts";

const DEFAULT_SETTINGS = {
    INTERVAL_DURATION: 25,
    S_BREAK: 5,
    L_BREAK: 15,
    SESSIONS: 4,
    CYCLES: 4,
} as const;

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
function parseBackgroundState(storedState: any): BackgroundState {
    if (!storedState) return storedState;

    return {
        ...storedState,
        pomodoroClock: {
            ...storedState.pomodoroClock,
            startTime: storedState.pomodoroClock.startTime ? new Date(storedState.pomodoroClock.startTime) : null,
            endTime: storedState.pomodoroClock.endTime ? new Date(storedState.pomodoroClock.endTime) : null,
            history: storedState.pomodoroClock.history.map((entry: Timestamp) => ({
                ...entry,
                time: new Date(entry.time)
            }))
        },
        settings: {
            ...storedState.settings,
            startTime: storedState.settings.startTime ? new Date(storedState.settings.startTime) : null,
            endTime: storedState.settings.endTime ? new Date(storedState.settings.endTime) : null
        }
    };
}
export {DEFAULT_SETTINGS, formatTime, calculateSessionDuration, parseBackgroundState};