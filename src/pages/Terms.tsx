import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => (
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
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Terms of Service</h1>
      </div>

      <p className="text-muted-foreground mb-10">Last Updated: July 8, 2026</p>

      <div className="prose prose-slate max-w-none">
        <p className="text-foreground/80 leading-relaxed mb-6">
          Welcome to ScopeSG. These Terms of Service ("Terms") govern your access to and use of ScopeSG, an AI-powered market intelligence platform designed for Singapore entrepreneurs and SMEs.
        </p>

        <p className="text-foreground/80 leading-relaxed mb-10">
          By accessing or using our platform, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
        </p>

        <Section title="1. Acceptance of Terms">
          <p className="mb-3">
            By creating an account, accessing, or using ScopeSG ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the Platform after any changes constitutes acceptance of the new Terms. We will notify users of significant changes through the Platform or via email.
          </p>
        </Section>

        <Section title="2. Use of Service">
          <SubSection title="a. Eligibility">
            <p className="mb-3">To use the Platform, you must:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Not be prohibited from using the service under applicable laws</li>
            </ul>
          </SubSection>
          <SubSection title="b. Account Responsibilities">
            <p className="mb-3">You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
            </ul>
          </SubSection>
          <SubSection title="c. Permitted Uses">
            <p>You may use the Platform for lawful purposes related to market research, business analysis, and entrepreneurial activities in Singapore.</p>
          </SubSection>
          <SubSection title="d. Prohibited Uses">
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Interfere with or disrupt the operation of the Platform</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
              <li>Use automated systems or software to extract data from the Platform without permission</li>
              <li>Transmit viruses, malware, or any malicious code</li>
              <li>Impersonate any person or entity</li>
              <li>Engage in any activity that infringes on the rights of others</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. Payment and Refunds">
          <SubSection title="a. Report Pricing">
            <p className="mb-3">
              ScopeSG offers premium market intelligence reports at a cost of <strong>S$20 per report</strong>. Payment is required before report generation.
            </p>
          </SubSection>
          <SubSection title="b. Payment Processing">
            <p className="mb-3">
              Payments are processed securely through our third-party payment provider (Stripe). We do not store your full credit card or banking details on our servers.
            </p>
          </SubSection>
          <SubSection title="c. Refund Policy">
            <p className="mb-3">
              <strong>All sales are final.</strong> Once a report has been generated and delivered, no refunds will be provided.
            </p>
            <p className="mb-3">
              Refund requests made before report generation may be considered on a case-by-case basis. To request a pre-generation refund, please contact us at the email address provided below.
            </p>
            <p>
              Refunds are not available for: generated reports, reports with content that the user disagrees with, or reports where the user's expectations were not met.
            </p>
          </SubSection>
          <SubSection title="d. Currency">
            <p>All prices are in Singapore Dollars (SGD/S$) unless otherwise stated.</p>
          </SubSection>
        </Section>

        <Section title="4. AI-Generated Content Disclaimer">
          <p className="mb-3">
            <strong>Important:</strong> ScopeSG uses artificial intelligence to generate market intelligence, analysis, and recommendations.
          </p>
          <p className="mb-3">
            All content generated by the Platform is provided for informational and educational purposes only. AI-generated content:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>May contain inaccuracies, errors, or outdated information</li>
            <li>Should not be relied upon as legal, financial, investment, or professional advice</li>
            <li>Does not constitute an endorsement, recommendation, or guarantee of any outcome</li>
            <li>May reflect limitations in the AI's training data or understanding</li>
          </ul>
          <p className="mb-3">
            <strong>You are solely responsible for:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Verifying all information before making business decisions</li>
            <li>Consulting with qualified professionals for legal, financial, and regulatory matters</li>
            <li>Conducting your own due diligence and research</li>
          </ul>
          <p className="mt-3">
            ScopeSG does not warrant the accuracy, completeness, or timeliness of any AI-generated content.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <SubSection title="a. Platform Ownership">
            <p className="mb-3">
              ScopeSG, including its original content, features, functionality, design, branding, and underlying technology, is owned by us and protected by intellectual property laws.
            </p>
          </SubSection>
          <SubSection title="b. User Content">
            <p className="mb-3">
              You retain ownership of content you submit to the Platform (such as prompts, business descriptions, or questions).
            </p>
            <p className="mb-3">
              By submitting content, you grant us a limited, non-exclusive license to process your content solely to provide the Platform's services to you.
            </p>
          </SubSection>
          <SubSection title="c. Generated Reports">
            <p className="mb-3">
              Paid reports generated for you are for your personal, non-commercial use. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Redistribute, resell, or share reports with third parties for commercial purposes</li>
              <li>Reproduce reports in bulk or for redistribution</li>
              <li>Remove any proprietary notices from report content</li>
            </ul>
          </SubSection>
          <SubSection title="d. Third-Party Content">
            <p>
              The Platform may contain or link to third-party content. We do not claim ownership of such content and respect the intellectual property rights of others.
            </p>
          </SubSection>
        </Section>

        <Section title="6. Limitation of Liability">
          <SubSection title="a. Disclaimer of Warranties">
            <p className="mb-3">
              THE PLATFORM AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties that the Platform will be uninterrupted, error-free, or secure</li>
              <li>Warranties regarding the accuracy, reliability, or completeness of AI-generated content</li>
            </ul>
          </SubSection>
          <SubSection title="b. Limitation of Liability">
            <p className="mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCOPESG AND ITS OWNERS, OPERATORS, AFFILIATES, AND PARTNERS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, business opportunities, or goodwill</li>
              <li>Damages arising from reliance on AI-generated content</li>
              <li>Damages arising from unauthorized access to your account</li>
              <li>Any damages exceeding the amount you paid to ScopeSG in the twelve (12) months preceding the claim</li>
            </ul>
          </SubSection>
          <SubSection title="c. Indemnification">
            <p>
              You agree to indemnify and hold harmless ScopeSG and its affiliates from any claims, damages, losses, or expenses arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.
            </p>
          </SubSection>
        </Section>

        <Section title="7. Governing Law">
          <p className="mb-3">
            These Terms of Service shall be governed by and construed in accordance with the laws of <strong>Singapore</strong>, without regard to its conflict of law provisions.
          </p>
          <p className="mb-3">
            Any disputes arising from or related to these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Singapore.
          </p>
          <p>
            Nothing in these Terms shall limit any rights you may have under Singapore consumer protection laws that cannot be waived or limited by contract.
          </p>
        </Section>

        <Section title="8. Termination">
          <p className="mb-3">
            We reserve the right to suspend or terminate your access to the Platform at any time, with or without cause, with or without notice.
          </p>
          <p>
            Upon termination: (a) your right to use the Platform will immediately cease; (b) we may delete your account and associated data; and (c) no refund will be provided for any paid services.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p className="mb-3">If you have questions about these Terms of Service, please contact:</p>
          <div className="bg-muted/50 rounded-lg p-4 mt-2">
            <p className="font-medium">ScopeSG</p>
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

export default Terms;
