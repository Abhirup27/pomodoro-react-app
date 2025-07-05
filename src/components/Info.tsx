import {type PomodoroClock, PomoState} from "../types.ts";
import {formatTime} from "../utils.ts";
import InfoItem from "./InfoItem.tsx";

interface InfoProps {
    pomodoroClock: PomodoroClock,
    currentState: PomoState,
    nextBreak: number,
    remainingRest: number,
    isResting: boolean,
    isWorking: boolean,

}

function Info ({currentState, pomodoroClock, nextBreak, remainingRest, isResting, isWorking}: InfoProps) {
    return (
        <div className="timer-info">
            <div className="info-grid">
                <InfoItem className={"status-indicator"}>{['Status', currentState]}</InfoItem>
                <InfoItem className={"info"}>{['Total time', formatTime(pomodoroClock.totalTime)]}</InfoItem>
                <InfoItem >{['Completed cycles', pomodoroClock.cyclesDone.toString()]}</InfoItem>
                <InfoItem >{['Completed sessions', pomodoroClock.sessionsDone.toString()]}</InfoItem>
                {isWorking && <InfoItem >{['Next break', new Date(nextBreak).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})]}</InfoItem>}
                {isResting && <InfoItem >{['Rest Remaining', formatTime(remainingRest)]}</InfoItem>}
                {isWorking || isResting ? <InfoItem >{['End time',  pomodoroClock.endTime instanceof Date
                    ? pomodoroClock.endTime.toLocaleTimeString()
                    : "Invalid date"]}</InfoItem>: null}
            </div>
        </div>
    )
}

export default Info;