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

export default ProgressCircle;