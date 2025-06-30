
interface ControlProps {
    toggleTimer: () => void;
    isFinished: boolean;
    isActive: boolean;
    time: number;

}
function Controls({toggleTimer, isFinished, isActive, time}: ControlProps){
    return (
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
    )
}

export default Controls;