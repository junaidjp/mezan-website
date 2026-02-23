export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Mezan <span className="text-emerald-400">Investing</span>
          </a>
          <nav className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="/" className="hover:text-white">
              Home
            </a>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

        <div className="space-y-6 text-white/80">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              1. Introduction
            </h2>
            <p>
              Mezan Investing ("we," "our," or "us") is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our mobile
              application and website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              2. Information We Collect
            </h2>
            <p>
              We may collect information about you in a variety of ways,
              including:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                <strong>Personal Data:</strong> Name, email address, phone
                number, and account credentials
              </li>
              <li>
                <strong>Device Information:</strong> Device type, operating
                system, unique identifiers, and mobile network information
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used,
                searches, and interaction patterns
              </li>
              <li>
                <strong>Location Data:</strong> General location information
                based on IP address (if applicable)
              </li>
              <li>
                <strong>Financial Information:</strong> Stock portfolios,
                watchlists, and trading preferences (for analysis purposes only)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your user experience</li>
              <li>Send transactional and promotional communications</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>
                Detect, prevent, and address technical and security issues
              </li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              4. How We Protect Your Information
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. This includes encryption,
              secure servers, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              5. Sharing Your Information
            </h2>
            <p>
              We do not sell, trade, or rent your personal information. We may
              share your information only in the following circumstances:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                With service providers who assist us in operating our
                application
              </li>
              <li>When required by law or legal process</li>
              <li>
                To protect the rights and safety of our users and the public
              </li>
              <li>In the event of a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              6. Third-Party Links
            </h2>
            <p>
              Our application may contain links to third-party websites and
              services. We are not responsible for the privacy practices of
              these external sites. Please review their privacy policies before
              providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              7. Your Rights
            </h2>
            <p>
              Depending on your jurisdiction, you may have the right to access,
              correct, or delete your personal information. Please contact us to
              exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              8. Cookies and Tracking
            </h2>
            <p>
              We use cookies and similar tracking technologies to enhance your
              experience. You can control cookie settings through your browser
              or device settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              9. Children's Privacy
            </h2>
            <p>
              Our services are not directed to individuals under the age of 13.
              We do not knowingly collect personal information from children. If
              we become aware of such collection, we will take steps to delete
              the information promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on our website
              and updating the "Last Updated" date below.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              11. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or our privacy
              practices, please contact us at:{" "}
              <span className="text-emerald-400">
                support@mezaninvesting.com
              </span>
            </p>
          </section>

          <div className="mt-8 border-t border-white/10 pt-4 text-sm text-white/50">
            <p>Last Updated: February 2026</p>
          </div>
        </div>
      </section>
    </main>
  );
}
