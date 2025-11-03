import React from 'react'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #1a1a1b 0%, #252526 100%)'
    }}>
      <div className="w-full max-w-2xl">
        <div className="mobile-card">
          <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Terms & Conditions</h1>
          <div className="space-y-4 text-gray-300 mobile-text-sm">
            <p>
              Welcome to Wall-B. By accessing or using the Service, you agree to be bound by these Terms & Conditions. Please read them carefully.
            </p>

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>1. Use of the Service</h2>
              <p>
                You must use the Service only in compliance with applicable laws and our acceptable use guidelines. You are responsible for your content and activity.
              </p>
            </section>

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>2. Accounts and Security</h2>
              <p>
                You are responsible for safeguarding your account credentials and for all activities under your account. Notify us of any unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>3. Content and Conduct</h2>
              <p>
                Do not post content that is illegal, abusive, or violates others' rights. We may remove content or suspend accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>4. Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. We process data as described there.
              </p>
            </section>

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>5. Disclaimers and Liability</h2>
              <p>
                The Service is provided "as is" without warranties. To the maximum extent permitted by law, Wall-B is not liable for any damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>6. Changes</h2>
              <p>
                We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <p className="text-gray-400">
              If you have questions about these Terms, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
