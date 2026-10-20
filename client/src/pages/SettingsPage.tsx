import { PageHeader } from '../components/PageHeader'
import { DataExport } from '../components/settings/DataExport'
import { DeleteAccount } from '../components/settings/DeleteAccount'
import { PasswordForm } from '../components/settings/PasswordForm'
import { ProfileForm } from '../components/settings/ProfileForm'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and your data." />
      <div className="max-w-2xl space-y-6">
        <ProfileForm />
        <PasswordForm />
        <DataExport />
        <DeleteAccount />
      </div>
    </div>
  )
}