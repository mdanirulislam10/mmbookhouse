import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | M.M Book House Malda',
  description:
    'How M.M Book House handles customer information and the private Google Drive backup integration.',
};

const updatedOn = '20 September 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto min-h-[75vh] max-w-4xl px-4 py-10">
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="mb-2 text-sm font-semibold text-amber-700">M.M Book House Malda</p>
        <h1 className="text-3xl font-black text-gray-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {updatedOn}</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-950">Information we process</h2>
            <p className="mt-2">
              We process information needed to operate the bookstore, including account,
              order, delivery, payment-status and support information supplied by customers.
              Payment card details are handled by the payment provider and are not stored by
              this application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Google Drive backup access</h2>
            <p className="mt-2">
              The private MM Enterprise Backup integration is used only by the store owner to
              create and manage encrypted database-backup files in the owner&apos;s Google Drive.
              It requests the limited Google Drive file permission and does not read unrelated
              Drive files. Ordinary customers are never asked to connect their Google Drive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Storage and security</h2>
            <p className="mt-2">
              Administrative credentials are restricted to server-side systems. Backup files
              are encrypted before upload. Access may be revoked at any time from the owner&apos;s
              Google Account security settings, and stored integration credentials can be
              removed from the repository settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Sharing and retention</h2>
            <p className="mt-2">
              We do not sell personal information. Information is shared only with service
              providers required to operate orders, payments, delivery, hosting and backups,
              or when required by law. Records are retained only for operational, accounting,
              security and legal needs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Contact</h2>
            <p className="mt-2">
              For a privacy question or request, please use our{' '}
              <Link className="font-semibold text-amber-700 underline" href="/support">
                customer-support page
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
