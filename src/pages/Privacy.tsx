import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
      </div>

      <p className="text-muted-foreground mb-10">Last Updated: May 18, 2026</p>

      <div className="prose prose-slate max-w-none">
        <p className="text-foreground/80 leading-relaxed mb-6">
          Welcome to ScopeSG. This Privacy Policy explains how we collect, use, store, and protect information when you use our platform and services.
        </p>

        <p className="text-foreground/80 leading-relaxed mb-6">
          ScopeSG provides AI-assisted startup research, market analysis, and policy or regulatory insight tools for informational purposes.
        </p>

        <p className="text-foreground/80 leading-relaxed mb-10">
          By accessing or using the platform, you agree to the practices described in this Privacy Policy.
        </p>

        <Section title="1. Information We Collect">
          <SubSection title="a. Information You Provide">
            <p className="mb-3">We may collect information that you voluntarily submit, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name</li>
              <li>Email address</li>
              <li>Account information</li>
              <li>Startup ideas or business descriptions</li>
              <li>Messages, prompts, and uploaded content submitted through the platform</li>
            </ul>
          </SubSection>
          <SubSection title="b. Usage Information">
            <p className="mb-3">We may automatically collect certain technical and usage information, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Browser type</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Pages visited</li>
              <li>Session activity</li>
              <li>Referral links and timestamps</li>
            </ul>
          </SubSection>
          <SubSection title="c. Cookies and Analytics">
            <p>
              We may use cookies and analytics tools to improve platform performance, understand user behavior, and enhance user experience.
            </p>
          </SubSection>
        </Section>

        <Section title="2. How We Use Information">
          <p className="mb-3">We may use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide AI-generated research and analysis</li>
            <li>Improve platform functionality and performance</li>
            <li>Personalize user experience</li>
            <li>Monitor usage and prevent abuse</li>
            <li>Respond to inquiries and support requests</li>
            <li>Develop new features and services</li>
          </ul>
        </Section>

        <Section title="3. AI Processing and Third-Party Services">
          <p className="mb-3">
            Some platform functions may rely on third-party infrastructure and AI service providers, including cloud hosting, analytics, and AI model providers.
          </p>
          <p className="mb-3">
            Information submitted through the platform may be processed by these services solely for the purpose of operating and improving the platform.
          </p>
          <p>We do not sell personal information to third parties.</p>
        </Section>

        <Section title="4. Data Storage and Security">
          <p className="mb-3">
            We take reasonable administrative and technical measures to protect user information from unauthorized access, misuse, or disclosure.
          </p>
          <p>However, no online platform or electronic storage system can guarantee absolute security.</p>
        </Section>

        <Section title="5. User Responsibilities">
          <p className="mb-3">Users should avoid submitting:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confidential business information</li>
            <li>Proprietary materials</li>
            <li>Sensitive personal data</li>
            <li>Legally restricted information</li>
          </ul>
          <p className="mt-3">You remain responsible for the accuracy and legality of information submitted through the platform.</p>
        </Section>

        <Section title="6. AI-Generated Content Disclaimer">
          <p className="mb-3">
            Outputs generated by the platform are AI-assisted and provided for informational purposes only.
          </p>
          <p className="mb-3">
            The platform does not provide legal, financial, investment, regulatory, or professional advice. AI-generated outputs may contain inaccuracies, omissions, or outdated information.
          </p>
          <p>
            Users are responsible for independently verifying any information before making business, legal, financial, or operational decisions.
          </p>
        </Section>

        <Section title="7. Regulatory and Market Information">
          <p>
            While the platform aims to assist with startup research and policy analysis, regulatory requirements and market conditions may change over time and differ across jurisdictions. Users should independently confirm all regulatory, legal, and compliance obligations with qualified professionals or official government sources.
          </p>
        </Section>

        <Section title="8. Data Retention">
          <p className="mb-3">We may retain information for as long as reasonably necessary to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Operate the platform</li>
            <li>Improve services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce platform policies</li>
          </ul>
        </Section>

        <Section title="9. Your Rights">
          <p className="mb-3">You may request:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access to your information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your account or submitted data, subject to applicable legal obligations</li>
          </ul>
          <p className="mt-3">Requests may be submitted through the contact information below.</p>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy periodically. Continued use of the platform after updates constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="11. Paid Services and Payment Information">
          <p className="mb-3">
            We offer a paid premium service that allows users to access enhanced reports and features for a one-time fee of SGD $20.
          </p>
          <p className="mb-3">
            Payments are processed through third-party payment providers. We do not collect or store full credit card or banking details on our servers. Payment processing is handled securely by our payment partners, and their use of your information is governed by their respective privacy policies.
          </p>
          <p className="mb-3">When you make a purchase, we may collect and store limited information related to the transaction, such as:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confirmation of payment</li>
            <li>Transaction ID</li>
            <li>Purchase status (e.g. premium access granted)</li>
            <li>Email address associated with the purchase</li>
          </ul>
          <p className="mb-3 mt-3">This information is used solely to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide access to premium features</li>
            <li>Verify payment status</li>
            <li>Prevent fraud or abuse</li>
            <li>Provide customer support</li>
          </ul>
          <p className="mb-3 mt-3">
            Purchasing a premium report grants access to digital content and does not involve physical goods or recurring subscription unless explicitly stated.
          </p>
          <p>All payments are final unless otherwise stated in our refund policy or required by applicable law.</p>
        </Section>

        <Section title="12. Contact Us">
          <p className="mb-3">If you have questions regarding this Privacy Policy or your data, please contact:</p>
          <div className="bg-muted/50 rounded-lg p-4 mt-2">
            <p className="font-medium">Cadmus Chau</p>
            <p className="text-muted-foreground">Email: itscadmus@gmail.com</p>
          </div>
        </Section>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display text-xl font-semibold mb-4 text-foreground">{title}</h2>
    <div className="text-foreground/80 leading-relaxed">{children}</div>
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="font-medium text-foreground mb-2">{title}</h3>
    {children}
  </div>
);

export default Privacy;
