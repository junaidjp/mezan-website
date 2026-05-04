export default function TermsConditions() {
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
            <a href="/privacy-policy" className="hover:text-white">Privacy</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-2 text-4xl font-bold">Terms &amp; Conditions</h1>
        <p className="mb-8 text-sm text-white/40">Last Updated: May 3, 2026 · Effective: May 3, 2026</p>

        <div className="space-y-7 text-white/80 leading-relaxed">

          {/* IMPORTANT NOTICE BANNER */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
            <p className="text-sm font-semibold text-amber-300">PLEASE READ CAREFULLY</p>
            <p className="mt-2 text-sm text-white/80">
              These Terms include a <strong>binding arbitration provision</strong> and a <strong>class-action waiver</strong> (Section 17). They limit your right to bring lawsuits or participate in class actions. They also include important disclaimers and limitations of liability (Sections 6–10). By using the Service you accept these Terms in full.
            </p>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>
              These Terms &amp; Conditions (&quot;Terms&quot;) form a binding agreement between you (&quot;you&quot; or &quot;User&quot;) and Mezan Investing, a product of Nafitech LLC (&quot;Mezan,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), governing your use of the website mezaninvesting.com, the Mezan: Investing mobile application, and any related services (collectively, the &quot;Service&quot;). By accessing or using the Service, creating an account, or paying for a subscription, you agree to be bound by these Terms and by our <a href="/privacy-policy" className="text-emerald-400 hover:underline">Privacy Policy</a>. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least <strong>18 years of age</strong> and capable of entering into a legally binding contract under the laws of your jurisdiction to use the Service. If you are using the Service on behalf of an entity, you represent that you have authority to bind that entity. The Service is not available to anyone previously suspended or removed from the Service.
            </p>
          </Section>

          <Section title="3. Account Registration & Security">
            <p>
              To access most features you must create an account. You agree to provide accurate, complete information and to keep it current. You are responsible for all activity under your account and for keeping your password confidential. You must notify us immediately at support@mezaninvesting.com of any unauthorized access. We may suspend or terminate your account at any time for violation of these Terms or for conduct we determine is harmful to other users, the Service, or third parties.
            </p>
            <p className="mt-3">
              <strong>Single-session enforcement:</strong> The Service may enforce one active session per account. Signing in on a new device may sign you out of prior devices. This is a security measure, not a defect.
            </p>
          </Section>

          <Section title="4. Subscriptions, Billing, and Renewals">
            <p className="font-semibold text-white">4.1 Subscription Plans</p>
            <p>
              The Service offers paid subscription plans (e.g., &quot;Mezan Research Monthly&quot; and &quot;Mezan Research Annual&quot;). Specific features, prices, and billing periods are shown at checkout. Prices are in U.S. dollars unless otherwise noted and exclude any applicable taxes, which you are responsible for paying.
            </p>
            <p className="mt-3 font-semibold text-white">4.2 Auto-Renewal</p>
            <p>
              <strong>All paid subscriptions automatically renew</strong> at the end of each billing period (monthly or annual) at the then-current price for that plan, charged to your saved payment method, until you cancel. By subscribing, you authorize us and our payment processor (Stripe) to charge your payment method on a recurring basis.
            </p>
            <p className="mt-3 font-semibold text-white">4.3 Cancellation</p>
            <p>
              You may cancel your subscription at any time through your account settings or by emailing support@mezaninvesting.com. Cancellation takes effect at the end of the current billing period. You will retain access through that period; you will not receive a pro-rata refund for the unused portion. After cancellation, no further charges will be made.
            </p>
            <p className="mt-3 font-semibold text-white">4.4 Refund Policy</p>
            <p>
              All payments are final and non-refundable, except where required by applicable law. We do not provide refunds for partial billing periods, downgrades, or unused features. We may, in our sole discretion, issue a refund or credit in exceptional circumstances; doing so does not obligate us to do so in the future.
            </p>
            <p className="mt-3 font-semibold text-white">4.5 Price Changes</p>
            <p>
              We may change prices for new subscribers at any time. For existing subscribers, we will provide at least 30 days&apos; advance notice (by email or in-Service) before any price increase takes effect. Continued use after the effective date constitutes acceptance of the new price; if you do not accept, you may cancel before the next billing date.
            </p>
            <p className="mt-3 font-semibold text-white">4.6 Failed Payments</p>
            <p>
              If a payment fails, we may retry the charge for up to 14 days. If payment cannot be collected, we may suspend or terminate your access. You remain responsible for any unpaid amounts.
            </p>
            <p className="mt-3 font-semibold text-white">4.7 Founding-Member and Promotional Pricing</p>
            <p>
              From time to time we offer promotional or founding-member pricing. Where we have committed to honoring a specific price for an existing subscriber (&quot;grandfathered pricing&quot;), we will continue to charge that price for as long as the subscription remains active and uninterrupted. If the subscription is canceled or lapses, the user may resubscribe only at the then-current published price.
            </p>
          </Section>

          <Section title="5. License and Permitted Use">
            <p>
              Subject to your compliance with these Terms and timely payment of applicable fees, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service for your personal, non-commercial use only.
            </p>
            <p className="mt-3">You may NOT:</p>
            <List items={[
              "Copy, modify, distribute, sell, lease, or sublicense any part of the Service or its content.",
              "Reverse-engineer, decompile, or disassemble any part of the Service.",
              "Scrape, crawl, harvest, or use automated tools to access the Service except with our prior written consent.",
              "Use the Service to develop a competing product or service.",
              "Share, resell, or redistribute your account, login credentials, or premium content with any other person.",
              "Use the Service to publish, transmit, or distribute any content that is unlawful, defamatory, infringing, harassing, or otherwise objectionable.",
              "Attempt to gain unauthorized access to the Service, other accounts, computer systems, or networks connected to the Service.",
              "Interfere with or disrupt the Service, servers, or networks, including by transmitting viruses, malware, or excessive load.",
              "Use the Service in violation of any applicable law, regulation, or sanctions program.",
            ]} />
          </Section>

          <Section title="6. Not Investment Advice — Educational Use Only">
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
              <strong>IMPORTANT: MEZAN IS NOT A REGISTERED INVESTMENT ADVISER, BROKER-DEALER, OR FINANCIAL PLANNER.</strong> Mezan does not provide personalized investment advice, recommendations, or solicitations to buy or sell any security. The Service is provided for <strong>general informational and educational purposes only</strong> and operates as a publisher of general financial information under the publisher&apos;s exemption of Section 202(a)(11)(D) of the Investment Advisers Act of 1940.
            </p>
            <p className="mt-3">
              All content on the Service — including stock screens, technical signals, AI-generated thesis text, halal-compliance scores, watchlists, swing-trade ideas, charts, market data, and any other output — is information only. It is not tailored to any individual&apos;s financial situation, investment objectives, risk tolerance, or needs.
            </p>
            <p className="mt-3">
              You are <strong>solely responsible</strong> for your investment decisions. Before making any investment decision you should: (a) conduct your own research; (b) consult a licensed financial adviser, tax adviser, or attorney as appropriate to your situation; (c) understand the risks involved; (d) only invest funds you can afford to lose. Past performance does not guarantee future results. No content on the Service constitutes a guarantee of any return or outcome.
            </p>
          </Section>

          <Section title="7. Halal Screening Disclaimer">
            <p>
              Mezan&apos;s halal-compliance screening uses a methodology inspired by AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) standards. Different scholars and jurisdictions interpret Shariah compliance differently. <strong>We make no guarantee that our screening is 100% accurate or that any stock identified as &quot;halal&quot; will be considered halal under your or your scholar&apos;s interpretation.</strong> The screening is one input only. You are responsible for your own determination of whether any investment is permissible for you. Where in doubt, consult a qualified Islamic-finance scholar.
            </p>
          </Section>

          <Section title="8. AI-Generated Content">
            <p>
              Portions of the Service include content generated by artificial-intelligence models (e.g., OpenAI&apos;s GPT). AI-generated content may be incomplete, inaccurate, biased, or out of date. It is provided for informational purposes only and is not financial advice. We do not guarantee its accuracy. Always verify any factual claim against primary sources before acting on it. AI-generated content is clearly labeled as such within the Service.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              THE SERVICE AND ALL CONTENT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEZAN DISCLAIMS ALL WARRANTIES, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY OF CONTENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; THAT DEFECTS WILL BE CORRECTED; THAT THE SERVICE OR ITS SERVERS ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS; OR THAT ANY INFORMATION OR CONTENT IS ACCURATE, COMPLETE, OR CURRENT.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong> In no event will Mezan, its officers, directors, employees, agents, suppliers, or affiliates be liable to you for any indirect, incidental, consequential, special, exemplary, or punitive damages, including without limitation loss of profits, lost data, lost trading opportunities, or financial losses arising from any investment decision, even if we have been advised of the possibility of such damages.
            </p>
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
              <strong>LIABILITY CAP:</strong> Our total aggregate liability to you for any and all claims arising out of or relating to these Terms or the Service will not exceed the greater of (a) the total amount you paid us in fees during the 12 months immediately preceding the event giving rise to the claim, or (b) USD $50.
            </p>
            <p className="mt-3">
              You acknowledge that the foregoing limitations are an essential basis of the bargain between you and Mezan and that we would not provide the Service without them. Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities, so some of the above may not apply to you; in such jurisdictions, our liability is limited to the maximum extent permitted by law.
            </p>
            <p className="mt-3">
              <strong>You expressly agree that Mezan is not responsible for any trading losses, financial harm, or damages you may incur as a result of using the Service or relying on any content or signal provided through the Service.</strong>
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to defend, indemnify, and hold harmless Mezan and its officers, directors, employees, agents, suppliers, and affiliates from and against all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party right, including any intellectual-property or privacy right; (d) any content you submit to the Service; or (e) any investment or trading decision you make.
            </p>
          </Section>

          <Section title="12. Intellectual Property">
            <p>
              All content, features, and functionality of the Service — including text, graphics, logos, icons, images, audio, video, software, code, methodology, screening logic, and the &quot;Mezan&quot; name and brand — are owned by Mezan or its licensors and are protected by United States and international copyright, trademark, patent, trade-secret, and other intellectual-property laws. Nothing in these Terms transfers any ownership to you. The license granted in Section 5 is the only right you have to use the Service.
            </p>
          </Section>

          <Section title="13. User Content & Feedback">
            <p>
              If you submit content, suggestions, or feedback to us (&quot;User Content&quot;), you grant us a non-exclusive, worldwide, royalty-free, perpetual, irrevocable, sublicensable license to use, copy, modify, create derivative works from, distribute, and display that User Content for any purpose, including improving the Service. You represent that you have all rights necessary to grant this license. We are not obligated to use any User Content or feedback.
            </p>
          </Section>

          <Section title="14. DMCA & Copyright Complaints">
            <p>
              If you believe content on the Service infringes your copyright, send a notice to support@mezaninvesting.com containing: (a) your physical or electronic signature; (b) identification of the copyrighted work; (c) identification of the allegedly infringing material with its URL; (d) your contact information; (e) a statement of good-faith belief that use is not authorized; and (f) a statement under penalty of perjury that the information is accurate and you are authorized to act on the rights owner&apos;s behalf.
            </p>
          </Section>

          <Section title="15. Termination">
            <p>
              We may suspend or terminate your account, your access to the Service, or any subscription at any time, with or without notice, for any reason — including breach of these Terms, fraud, abuse, non-payment, or as required by law. On termination, your right to use the Service ends immediately. Sections that by their nature should survive termination (including Sections 6, 9, 10, 11, 12, 14, 15, 17, 18) shall survive.
            </p>
          </Section>

          <Section title="16. Modifications to the Service or Terms">
            <p>
              We may modify, suspend, or discontinue any part of the Service at any time, with or without notice, without liability to you. We may also modify these Terms from time to time; the &quot;Last Updated&quot; date at the top reflects the most recent change. For material changes that affect your rights, we will provide at least 30 days&apos; notice by email or through the Service before they take effect. Your continued use after the effective date constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="17. Binding Arbitration & Class-Action Waiver">
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-white/90">
              <strong>READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS.</strong>
            </p>
            <p className="mt-3 font-semibold text-white">17.1 Agreement to Arbitrate</p>
            <p>
              You and Mezan agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service (a &quot;Dispute&quot;) will be resolved exclusively by final and binding individual arbitration administered by JAMS under its Streamlined Arbitration Rules &amp; Procedures, rather than in court — except for matters that may be brought in small-claims court (Section 17.4) and except for actions to enjoin infringement of intellectual-property rights, which may be brought in court.
            </p>
            <p className="mt-3 font-semibold text-white">17.2 Class-Action Waiver</p>
            <p>
              <strong>YOU AND MEZAN AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING.</strong> The arbitrator may not consolidate more than one person&apos;s claims and may not preside over any form of representative or class proceeding.
            </p>
            <p className="mt-3 font-semibold text-white">17.3 Venue, Costs, and Procedure</p>
            <p>
              Arbitration will be conducted in English in the State of Texas, USA, or by videoconference. Each party will bear its own attorneys&apos; fees and costs except as the arbitrator may award. Judgment on the award may be entered in any court of competent jurisdiction.
            </p>
            <p className="mt-3 font-semibold text-white">17.4 Small-Claims Court</p>
            <p>
              Either party may bring an individual claim in small-claims court for Disputes within that court&apos;s jurisdiction, in lieu of arbitration.
            </p>
            <p className="mt-3 font-semibold text-white">17.5 30-Day Right to Opt Out</p>
            <p>
              You may opt out of this arbitration agreement by sending written notice to support@mezaninvesting.com within 30 days of first accepting these Terms. Your notice must include your name, account email, and a clear statement that you wish to opt out of arbitration. Opting out will not affect any other provision of these Terms.
            </p>
            <p className="mt-3 font-semibold text-white">17.6 Severability of Class-Action Waiver</p>
            <p>
              If the class-action waiver in Section 17.2 is held to be unenforceable as to any particular claim, that claim must be severed from the arbitration and brought in court; the remaining claims will continue in arbitration.
            </p>
          </Section>

          <Section title="18. Governing Law & Venue">
            <p>
              These Terms and any Dispute will be governed by and construed under the laws of the State of Texas, USA, without regard to its conflict-of-laws principles, and (subject to Section 17) the federal and state courts located in Travis County, Texas will have exclusive jurisdiction. The United Nations Convention on Contracts for the International Sale of Goods does not apply.
            </p>
          </Section>

          <Section title="19. Export Controls & Sanctions">
            <p>
              You may not use, export, re-export, or transfer the Service in violation of U.S. export laws or sanctions administered by the U.S. Department of the Treasury Office of Foreign Assets Control (OFAC). You represent that you are not located in any country subject to comprehensive U.S. sanctions and are not on any U.S. list of restricted parties.
            </p>
          </Section>

          <Section title="20. Force Majeure">
            <p>
              We are not liable for any failure or delay in performance caused by events beyond our reasonable control, including acts of God, war, terrorism, civil unrest, government action, pandemic, internet or utility outages, third-party service disruptions, or labor disputes.
            </p>
          </Section>

          <Section title="21. Assignment">
            <p>
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms to any affiliate or in connection with a merger, acquisition, sale of assets, or by operation of law.
            </p>
          </Section>

          <Section title="22. Severability & Entire Agreement">
            <p>
              If any provision of these Terms is held invalid or unenforceable, that provision will be enforced to the maximum extent permitted, and the remaining provisions will remain in full force. These Terms, together with the Privacy Policy and any plan-specific terms presented at checkout, constitute the entire agreement between you and Mezan and supersede all prior agreements on the subject.
            </p>
          </Section>

          <Section title="23. No Waiver">
            <p>
              Our failure to enforce any right or provision will not be deemed a waiver of that right or provision. No waiver will be effective unless made in writing and signed by us.
            </p>
          </Section>

          <Section title="24. Contact">
            <p>
              For questions about these Terms or to send any notice required under these Terms:
            </p>
            <p className="mt-2">
              Email: <span className="text-emerald-400">support@mezaninvesting.com</span>
            </p>
          </Section>

          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/40">
            <p>
              By creating an account or paying for a subscription, you acknowledge that you have read, understood, and agree to be bound by these Terms &amp; Conditions and the Privacy Policy.
            </p>
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
