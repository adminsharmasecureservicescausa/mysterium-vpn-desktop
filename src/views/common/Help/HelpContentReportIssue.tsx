/**
 * Copyright (c) 2020 BlockDev AG
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useRef } from "react"
import styled from "styled-components"
import { observer } from "mobx-react-lite"
import { useToasts } from "react-toast-notifications"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBug } from "@fortawesome/free-solid-svg-icons"

import { Heading2, Small } from "../../../ui-kit/typography"
import { TextInput } from "../../../ui-kit/form-components/TextInput"
import { TextArea } from "../../../ui-kit/form-components/TextArea"
import { useStores } from "../../../store"
import { log } from "../../../log/log"
import { userEvent } from "../../../analytics/analytics"
import { OtherAction } from "../../../analytics/actions"
import { LightButton } from "../../../ui-kit/components/Button/LightButton"

const Title = styled(Heading2)`
    margin: 15px 0;
`

const Explanation = styled(Small)`
    opacity: 0.5;
    margin-bottom: 15px;
`

const DescriptionTextArea = styled(TextArea)`
    height: 140px;
    resize: none;
`

const SendButton = styled(LightButton)`
    margin-top: auto;
    width: 120px;
`

export const HelpContentReportIssue: React.FC = observer(() => {
    const { feedback } = useStores()
    const { addToast } = useToasts()
    const email = useRef<HTMLInputElement>(null)
    const description = useRef<HTMLTextAreaElement>(null)
    const clearInputs = () => {
        if (email.current) {
            email.current.value = ""
        }
        if (description.current) {
            description.current.value = ""
        }
    }
    const submit = async () => {
        userEvent(OtherAction.SubmitBugReport)
        try {
            const issueId = await feedback.reportIssue({
                email: email.current?.value,
                description: description.current?.value ?? "",
            })
            addToast(`Thanks for the feedback! Issue reference #${issueId}`, { appearance: "success" })
            clearInputs()
        } catch (err) {
            addToast("Could not submit the report.\nPlease try again later.", {
                appearance: "error",
                autoDismiss: true,
            })
            log.error("Could not submit the report", err.message)
        }
    }
    return (
        <>
            <FontAwesomeIcon icon={faBug} color="#ffffff88" size="2x" />
            <Title>Bug report</Title>
            <Explanation>
                Describe the problem you got while using the application. We will try to solve it. Also leave your email
                so that we can contact you if needed.
            </Explanation>
            <TextInput placeholder="Email (optional)" ref={email} />
            <DescriptionTextArea placeholder="Describe the issue" ref={description} />
            <Explanation>
                Description and <strong>application logs</strong> will be attached to the issue. Logs may include
                sensitive information, such as IP address and location. It will be only accessible and used by the dev
                team to address the issue you are having.
            </Explanation>
            <SendButton onClick={submit} loading={feedback.loading}>
                Send
            </SendButton>
        </>
    )
})
