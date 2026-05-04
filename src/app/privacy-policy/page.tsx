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
            <a href="/" className="hover:text-white">Home</a>
            <a href="/terms-conditions" className="hover:text-white">Terms</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-sm text-white/40">Last Updated: May 3, 2026 · Effective: May 3, 2026</p>

        <div className="space-y-7 text-white/80 leading-relaxed">

          <Section title="1. Introduction & Scope">
            <p>
              Mezan Investing, a product of Nafitech LLC (&quot;Mezan,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operates the website mezaninvesting.com and the related Mezan: Investing mobile application (collectively, the &quot;Service&quot;). This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices you have. By using the Service you consent to the practices described here. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information:</p>
            <List items={[
              "Account data: name, email address, hashed password, Firebase user ID, sign-in timestamps.",
              "Subscription data: subscription tier, status (active/canceled/past-due), Stripe customer ID, plan ID. We do not store full credit-card numbers; payment data is collected directly by Stripe under Stripe's privacy policy.",
              "Profile and usage data: pages viewed, search queries, tickers researched, watchlists, click events, session timestamps, IP address, browser/device type, operating system, approximate location derived from IP.",
              "Communications: messages you send to support@mezaninvesting.com, including any attachments.",
              "Cookies and similar technologies: session cookies for authentication, anonymous analytics cookies. See §8.",
              "Inferred data: derived aggregates such as your approximate region, device class, or research preferences used to personalize the Service.",
            ]} />
            <p className="mt-3"><strong>What we do NOT collect:</strong> we do not collect government IDs, social security numbers, or biometric data. We do not collect or store credit-card numbers, CVVs, or banking credentials — those go directly to Stripe.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use information for the following purposes only:</p>
            <List items={[
              "To provide, operate, and maintain the Service (account creation, subscription gating, search, research generation).",
              "To process payments and subscriptions through our payment processor.",
              "To communicate with you about the Service (transactional emails, security alerts, billing notices).",
              "To send marketing or product-update emails — you may opt out at any time via the unsubscribe link or by emailing us.",
              "To improve and personalize the Service, including analytics and aggregated usage measurement.",
              "To detect, prevent, and respond to fraud, abuse, security incidents, and technical issues.",
              "To comply with legal obligations and enforce our Terms.",
            ]} />
          </Section>

          <Section title="4. AI-Generated Content & Third-Party AI Processing">
            <p>
              Some features of the Service use artificial intelligence (specifically OpenAI&apos;s GPT models) to generate company summaries, investment theses, and analysis text. To produce this content, we send the relevant ticker symbol and publicly available company description (sourced from Financial Modeling Prep) to OpenAI&apos;s API. <strong>We do not send your personal information, account data, watchlists, or browsing history to OpenAI.</strong> AI-generated content is clearly labeled and is provided for informational purposes only — it is not financial advice.
            </p>
          </Section>

          <Section title="5. Subprocessors and Third-Party Services">
            <p>We share information with the following service providers (&quot;subprocessors&quot;) only to operate the Service. Each is bound by their own privacy and security obligations:</p>
            <List items={[
              "Stripe (Stripe, Inc.) — payment processing, billing, and subscription management. Stripe receives your name, email, billing address, and card details directly. See stripe.com/privacy.",
              "Firebase / Google Cloud (Google LLC) — authentication, analytics, hosting of certain data. See firebase.google.com/support/privacy.",
              "MongoDB Atlas (MongoDB, Inc.) — primary application database hosting. See mongodb.com/legal/privacy-policy.",
              "Vercel, Inc. — website hosting, edge runtime, and (if enabled) anonymous analytics. See vercel.com/legal/privacy-policy.",
              "Google Cloud Platform (Google LLC) — backend API and batch processing infrastructure.",
              "OpenAI, L.L.C. — AI-generated company summaries (see §4 above for what data is sent). See openai.com/policies/privacy-policy.",
              "Financial Modeling Prep (FMP) — market data provider; we send only ticker symbols, never user data. See site.financialmodelingprep.com/policies.",
              "RevenueCat, Inc. — mobile-app subscription management. See revenuecat.com/privacy.",
              "Apple Inc. and Google LLC — for in-app purchase processing on iOS and Android.",
            ]} />
            <p className="mt-3">
              We may also disclose information in the following limited circumstances: (a) in response to lawful requests from public authorities (subpoenas, court orders); (b) to protect our rights, property, or safety, or those of our users or the public; (c) in connection with a merger, acquisition, financing, or sale of all or part of our business — in which case the successor entity is bound by this Policy as to existing data.
            </p>
            <p className="mt-3"><strong>We do not sell your personal information.</strong> We do not share your personal information with advertisers.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain account and subscription data for as long as your account is active and for up to 24 months after account closure to comply with tax, accounting, fraud-prevention, and legal obligations. Anonymous and aggregated data may be retained indefinitely. You may request deletion at any time (see §9).
            </p>
          </Section>

          <Section title="7. International Data Transfers">
            <p>
              The Service is operated from the United States. If you access the Service from outside the United States, your information will be transferred to, processed in, and stored in the United States. By using the Service you consent to this transfer. Where required by law (e.g., for users in the European Economic Area or the United Kingdom), we rely on Standard Contractual Clauses or equivalent mechanisms with our subprocessors.
            </p>
          </Section>

          <Section title="8. Cookies and Tracking">
            <p>We use the following cookies and similar technologies:</p>
            <List items={[
              "Strictly necessary cookies: session token, authentication, CSRF protection. The Service cannot function without these.",
              "Analytics cookies: anonymous, aggregated data on which pages are viewed and how the Service is used. Helps us improve the product.",
              "Preference cookies: remember your theme (dark/light), recent tickers, and similar UI choices.",
            ]} />
            <p className="mt-3">
              We do not use third-party advertising cookies. You can disable cookies through your browser settings; doing so may break sign-in and other features. We do not currently respond to &quot;Do Not Track&quot; browser signals because no industry standard exists.
            </p>
          </Section>

          <Section title="9. Your Privacy Rights">
            <p>Depending on your jurisdiction, you have the rights below. To exercise any of them, email <span className="text-emerald-400">support@mezaninvesting.com</span> from the address associated with your account. We will respond within 30 days (or as required by your jurisdiction).</p>

            <p className="mt-4 font-semibold text-white">Users in the European Economic Area, United Kingdom, and Switzerland (GDPR / UK GDPR):</p>
            <List items={[
              "Right of access — obtain a copy of personal data we hold about you.",
              "Right to rectification — correct inaccurate or incomplete data.",
              "Right to erasure (&quot;right to be forgotten&quot;) — request deletion of your data, subject to legal retention requirements.",
              "Right to restrict processing — limit how we use your data.",
              "Right to data portability — receive your data in a structured, machine-readable format.",
              "Right to object — object to processing based on our legitimate interests, including direct marketing.",
              "Right to lodge a complaint — file a complaint with your local supervisory authority.",
              "Lawful bases we rely on: performance of a contract (for Service operation), legitimate interest (analytics, fraud prevention), consent (marketing emails), and legal obligation (tax, anti-fraud).",
            ]} />

            <p className="mt-4 font-semibold text-white">Users in California (CCPA / CPRA):</p>
            <List items={[
              "Right to know what categories of personal information we have collected, the sources, the business purposes, and the categories of third parties we shared it with.",
              "Right to delete personal information, subject to legal retention exceptions.",
              "Right to correct inaccurate personal information.",
              "Right to opt out of &quot;sale&quot; or &quot;sharing&quot; — we do not sell or share personal information for cross-context behavioral advertising.",
              "Right to limit use of sensitive personal information — we do not use sensitive personal information beyond what is necessary to operate the Service.",
              "Right to non-discrimination — exercising any of these rights will not affect your service or pricing.",
            ]} />

            <p className="mt-4 font-semibold text-white">All users:</p>
            <List items={[
              "You may close your account at any time via account settings or by emailing support.",
              "You may download or request a copy of your personal data.",
              "You may unsubscribe from marketing emails using the link in any marketing message.",
            ]} />
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              The Service is not directed to and not intended for individuals under 18 years of age. We do not knowingly collect personal information from anyone under 18. If you become aware that a child under 18 has provided us with personal information, please contact support@mezaninvesting.com and we will delete it promptly. If we learn that we have inadvertently collected information from a child under 13 (US) or under 16 (EEA/UK), we will delete it as required by COPPA and GDPR respectively.
            </p>
          </Section>

          <Section title="11. Security">
            <p>
              We implement reasonable technical and organizational measures to protect your information, including encryption in transit (TLS), encryption at rest for sensitive fields, access controls, and routine security reviews. However, no system is perfectly secure. We cannot guarantee absolute security and disclaim liability for unauthorized access that occurs despite our reasonable safeguards. If we become aware of a security incident affecting your data, we will notify you and, where required, the relevant authorities, in accordance with applicable law.
            </p>
          </Section>

          <Section title="12. Third-Party Links">
            <p>
              The Service may link to third-party websites, services, or content (including external broker platforms, news sites, or charting tools). We are not responsible for the privacy practices of those third parties. Review their policies before providing information.
            </p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last Updated&quot; date at the top reflects the most recent change. For material changes that affect your rights, we will notify you by email or through the Service at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Policy.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              Questions, requests, or complaints about this Privacy Policy or our handling of your data:
            </p>
            <p className="mt-2">
              Email: <span className="text-emerald-400">support@mezaninvesting.com</span><br />
              Subject line: &quot;Privacy Request&quot;
            </p>
          </Section>

          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/40">
            <p>This Privacy Policy is provided for informational purposes and does not create a contract beyond what is described in our Terms &amp; Conditions. By using the Service you agree both to this Privacy Policy and to our Terms &amp; Conditions.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-semibold text-white">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-6">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
