import { ProposalList } from "@/components/proposal-list"

export default function PortalProposalsPage() {
  return (
    <div className="p-6">
      <ProposalList showActions={false} />
    </div>
  )
}
