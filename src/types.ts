export type Timestamp = {
    state: PomoState;
    time: Date;
    action: 'Start' | 'Resume' | 'Paused' | null;
};

export enum PomoState {
    INIT = 'init',
    WORK = 'work',
    REST = 'rest',
    FINISHED = 'finished',
}

export type PomodoroClock = {
    startTime: Date | null;
    endTime: Date | null;
    totalTime: number;
    history: Timestamp[];
    cyclesDone: number;
    sessionsDone: number;
};

export type Settings = {
    cycles: number;
    sessions: number;
    longBreak: number;
    smallBreak: number;
    intervalDuration: number;
    startTime?: Date | null;
    endTime?: Date | null;
};
