import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Πολιτική Απορρήτου | Politografisi.gr",
  description: "Ενημερωθείτε για το πώς συλλέγουμε και προστατεύουμε τα προσωπικά σας δεδομένα.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-black text-blue-950 mb-8">Πολιτική Απορρήτου</h1>
          <p className="text-slate-500 mb-12">Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}</p>

          <div className="space-y-12">
            
            {/* 1. Συλλογή Δεδομένων */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">1. Ποια δεδομένα συλλέγουμε</h2>
              <p className="leading-relaxed">
                Συλλέγουμε μόνο τα απαραίτητα δεδομένα για την παροχή των υπηρεσιών μας:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li><strong>Στοιχεία Ταυτοποίησης:</strong> Όνομα, Επίθετο, Email (μέσω εγγραφής ή Google Login).</li>
                <li><strong>Δεδομένα Προόδου:</strong> Αποτελέσματα τεστ, ιστορικό ασκήσεων, ηχογραφήσεις (για την άσκηση ομιλίας) και κείμενα εκθέσεων.</li>
                <li><strong>Τεχνικά Δεδομένα:</strong> Διεύθυνση IP, τύπος προγράμματος περιήγησης (browser), cookies.</li>
              </ul>
            </section>

            {/* 2. Χρήση Δεδομένων */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">2. Πώς χρησιμοποιούμε τα δεδομένα</h2>
              <p className="leading-relaxed">
                Χρησιμοποιούμε τα δεδομένα σας αποκλειστικά για:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>Τη δημιουργία και διαχείριση του λογαριασμού σας.</li>
                <li>Την παροχή εξατομικευμένης εκπαιδευτικής εμπειρίας και στατιστικών.</li>
                <li>Τη βελτίωση των υπηρεσιών μας μέσω ανάλυσης χρήσης.</li>
                <li>Την επικοινωνία μαζί σας για θέματα υποστήριξης ή ενημερώσεις.</li>
              </ul>
            </section>

            {/* 3. AI & Τρίτα Μέρη */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">3. Τεχνητή Νοημοσύνη & Υπηρεσίες Τρίτων</h2>
              <p className="leading-relaxed">
                Για την αξιολόγηση των ασκήσεων (Writing & Speaking), χρησιμοποιούμε μοντέλα τεχνητής νοημοσύνης (π.χ. Google Gemini). Τα δεδομένα που αποστέλλονται είναι ανωνυμοποιημένα όπου είναι δυνατόν και δεν χρησιμοποιούνται για την εκπαίδευση των μοντέλων τρίτων με τρόπο που να σας ταυτοποιεί.
                Η πλατφόρμα φιλοξενείται σε ασφαλείς διακομιστές (Firebase/Google Cloud).
              </p>
            </section>

            {/* 4. Cookies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">4. Cookies</h2>
              <p className="leading-relaxed">
                Χρησιμοποιούμε cookies για τη διατήρηση της σύνδεσής σας (Authentication cookies) και για την ανάλυση της επισκεψιμότητας (Analytics). Μπορείτε να ρυθμίσετε τον browser σας να απορρίπτει τα cookies, ωστόσο η βασική λειτουργικότητα της πλατφόρμας ενδέχεται να επηρεαστεί.
              </p>
            </section>

            {/* 5. Ασφάλεια */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">5. Ασφάλεια Δεδομένων</h2>
              <p className="leading-relaxed">
                Λαμβάνουμε όλα τα απαραίτητα τεχνικά μέτρα για την προστασία των δεδομένων σας από μη εξουσιοδοτημένη πρόσβαση, απώλεια ή διαρροή. Οι κωδικοί πρόσβασης κρυπτογραφούνται και οι πληρωμές διεκπεραιώνονται από πιστοποιημένους παρόχους (π.χ. Stripe/Viva Wallet) χωρίς να αποθηκεύουμε στοιχεία καρτών.
              </p>
            </section>

            {/* 6. Δικαιώματα Χρηστών */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">6. Τα Δικαιώματά σας (GDPR)</h2>
              <p className="leading-relaxed">
                Σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR), έχετε δικαίωμα:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>Να ζητήσετε αντίγραφο των δεδομένων σας.</li>
                <li>Να ζητήσετε τη διόρθωση ή τη διαγραφή του λογαριασμού σας («Δικαίωμα στη λήθη»).</li>
                <li>Να ανακαλέσετε τη συγκατάθεσή σας ανά πάσα στιγμή.</li>
              </ul>
              <p className="mt-4">
                Για να ασκήσετε τα δικαιώματά σας, επικοινωνήστε στο <a href="mailto:privacy@politografisi.gr" className="text-blue-600 font-bold hover:underline">privacy@politografisi.gr</a>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}