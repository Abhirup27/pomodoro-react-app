interface InfoItemProps {
    children: Array<React.ReactNode>;
    [key : string]: string | string[] | React.ReactNode[];
    //className?: string;
}

function InfoItem({children, ...props }:  InfoItemProps) {
    return (
        <div className="info-item">
            <span>{children[0]}</span>
            <span {...(Object.keys(props).length === 0 ? { className: 'info' } : props)}>{children[1]}</span>
        </div>
    )
}

export default InfoItem;