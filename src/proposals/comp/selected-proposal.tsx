import React from "react"
import { Text, View } from "@nodegui/react-nodegui"
import { Proposal as ProposalType } from "mysterium-vpn-js/lib/proposal/proposal"
import { mystDisplay, pricePerGiB, pricePerMinute } from "mysterium-vpn-js"
import { observer } from "mobx-react-lite"
import { useStores } from "../../store"
import { Country } from "../../ui-kit/country/country"
import { ConnectDisconnectButton } from "../../connection/comp/connect-disconnect-button"

const timeRate = (p: ProposalType): number | undefined => {
    if (!p.paymentMethod) {
        return undefined
    }
    return mystDisplay(pricePerMinute(p.paymentMethod))
}

const trafficRate = (p: ProposalType): number | undefined => {
    if (!p.paymentMethod) {
        return undefined
    }
    return mystDisplay(pricePerGiB(p.paymentMethod))
}

export const SelectedProposal: React.FC = observer(() => {
    const { proposals } = useStores()
    const proposal = proposals.active
    if (!proposal) {
        return <></>
    }
    const pricingText = `${timeRate(proposal)}/min ${trafficRate(proposal)}/GiB`
    return (
        <View style={`flex: 1; align-items: "center";`}>
            <View style={`padding-right: 10;`}>
                <Country code={proposal.country} text={false} />
            </View>
            <View
                style={`
                flex-direction: "column";
                justify-content: "center";
                `}
            >
                <Text style={`font-weight: bold;`}>{proposal.id10}</Text>
                <Text>{pricingText}</Text>
            </View>
            <View
                style={`
                flex: 1; 
                justify-content: "flex-end";
                `}
            >
                <ConnectDisconnectButton width={100} height={40} />
            </View>
        </View>
    )
})
