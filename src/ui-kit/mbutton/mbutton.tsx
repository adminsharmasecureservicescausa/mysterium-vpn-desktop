import React from "react"
import { Button, useEventHandler } from "@nodegui/react-nodegui"
import { brand } from "../colors"
import { textRegular } from "../typography"

export type MButtonProps = {
    text: string
    enabled?: boolean
    onClick: () => void
}

export const MButton: React.FC<MButtonProps> = ({ text, enabled = true, onClick }) => {
    const clickHandler = useEventHandler({ ["clicked"]: () => onClick() }, [])
    return (
        <Button
            enabled={enabled}
            style={`
                ${textRegular} 
                padding: 10;
                font-weight: bold; 
                background: ${enabled ? brand : "#ddd"}; 
                color: #fff; 
                border-radius: 3;
            `}
            text={text}
            on={clickHandler}
        />
    )
}