export default function PrivacyPage() {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-6 py-12 text-[#26382D]">
        <article className="mx-auto max-w-2xl">
         
  
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[#667368]">
            Last updated: September 21, 2026
          </p>
  
          <div className="mt-8 space-y-8 leading-7">
            <section>
              <h2 className="text-xl font-semibold">About Conserva</h2>
              <p className="mt-2">
                Conserva helps you organize groceries, track expiration dates,
                receive reminders, discover recipes, and understand your
                food-saving activity. This policy explains how information is
                handled when you use Conserva.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold">
                Information You Provide
              </h2>
              <p className="mt-2">
                When you create an account, Conserva uses your email address
                and authentication information to provide account access.
                Conserva also stores information you choose to add, such as
                food names, quantities, storage locations, expiration dates,
                and preferences.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold">Receipt Scanning</h2>
              <p className="mt-2">
                If you choose to scan a receipt, Conserva processes the photo
                to identify grocery items. Conserva does not save the receipt
                photo. You can review the detected items before adding them
                to your kitchen inventory.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold">
                AI Features and Service Providers
              </h2>
              <p className="mt-2">
                Conserva uses third-party services to support features such
                as AI-powered recipe suggestions and food shelf-life
                estimates. Information needed for a request, such as food
                names or ingredients, may be sent to these services to
                generate a response.
              </p>
              <p className="mt-2">
                Conserva also uses service providers for account
                authentication, data storage, hosting, and reminders.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold">Reminders</h2>
              <p className="mt-2">
                If you enable reminders, Conserva uses your food expiration
                dates and reminder preferences to notify you about food
                that may need attention. You can change your reminder
                preferences in Settings.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold">Account Deletion</h2>
              <p className="mt-2">
                You can permanently delete your account from Conserva’s
                Settings page. Deleting your account removes your account
                and associated saved food, recipes, preferences, and
                reminder data from Conserva’s database.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="mt-2">
                For privacy questions, contact{" "}
                <a
                  href="mailto:trishnaerukulla@gmail.com"
                  className="text-[#52745A] underline"
                >
                  trishnaerukulla@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
    );
  }