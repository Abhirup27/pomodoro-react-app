import {type PomodoroClock, PomoState} from "../types.ts";
import {formatTime} from "../utils.ts";

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
                        <span className={"info"}>{new Date(nextBreak).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                )}

                {isResting && (
                    <div className="info-item">
                        <span>Rest remaining:</span>
                        <span className={"info"}>{formatTime(remainingRest)}</span>
                    </div>
                )}
                {isWorking || isResting ? ( <div className="info-item">
                        <span>End time:</span>
                        <span className={"info"}>{pomodoroClock.endTime!.toLocaleTimeString()}</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default Info;