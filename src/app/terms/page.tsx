import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | M.M Book House Malda',
  description: 'Terms governing use of the M.M Book House website and services.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-[75vh] max-w-4xl px-4 py-10">
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="mb-2 text-sm font-semibold text-amber-700">M.M Book House Malda</p>
        <h1 className="text-3xl font-black text-gray-950">Terms of Use</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: 20 September 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-950">Using the service</h2>
            <p className="mt-2">
              You may use this website to browse products, place genuine orders and contact
              support. You must provide accurate information and must not misuse the service,
              attempt unauthorised access or interfere with its operation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Orders and availability</h2>
            <p className="mt-2">
              Orders are subject to product availability, price confirmation and delivery
              coverage. If an item cannot be supplied, the store may contact the customer to
              offer an alternative, adjust the order or arrange an applicable refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Payments and delivery</h2>
            <p className="mt-2">
              Payments and deliveries may be handled by third-party providers under their own
              terms. Estimated delivery times are not guarantees when delays are outside the
              store&apos;s reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Support</h2>
            <p className="mt-2">
              For an order, return or service question, visit our{' '}
              <Link className="font-semibold text-amber-700 underline" href="/support">
                customer-support page
              </Link>
              . Our handling of personal information is described in the{' '}
              <Link className="font-semibold text-amber-700 underline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
