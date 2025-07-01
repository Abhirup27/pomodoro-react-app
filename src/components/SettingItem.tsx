
interface SettingItemProps {
    name: string,
    children: React.ReactNode,
    value: number,
    min: number,
    //onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    [key: string]: { (e: React.ChangeEvent<HTMLInputElement>): void } | string | number | React.ReactNode,
}

function SettingItem({name, children, value, min, ...props}: SettingItemProps) {
    return (
        <div className="setting-item">
            <label>{children}</label>
            <input
                type="number"
                name={name}
                value={value}
                {...props} //onChange={updateSettings}
                min={min}
            />
        </div>
    )
}

export default SettingItem;