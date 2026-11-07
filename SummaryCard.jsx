import DashboardIcon from './DashboardIcon'
import { formatUSD } from './dashboardPreviewData'

export default function SummaryCard({ label, amount, description, icon, variant = 'default' }) {
  return (
    <div className={`dashboard-summary-card dashboard-summary-${variant}`}>
      <div className="dashboard-summary-label">
        <h2>{label}</h2>
        <DashboardIcon name={icon} />
      </div>
      <p className="dashboard-summary-value">{formatUSD(amount)}</p>
      <p className="dashboard-summary-description">{description}</p>
    </div>
  )
}
