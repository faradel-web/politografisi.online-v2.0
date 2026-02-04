import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Όροι Χρήσης | Politografisi.gr",
  description: "Διαβάστε τους όρους χρήσης της πλατφόρμας προετοιμασίας για τις εξετάσεις πολιτογράφησης.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-black text-blue-950 mb-8">Όροι Χρήσης</h1>
          <p className="text-slate-500 mb-12">Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}</p>

          <div className="space-y-12">
            
            {/* 1. Εισαγωγή */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">1. Εισαγωγή</h2>
              <p className="leading-relaxed">
                Καλώς ήρθατε στο Politografisi.gr. Η χρήση της ιστοσελίδας και των υπηρεσιών μας συνεπάγεται την πλήρη και ανεπιφύλακτη αποδοχή των παρόντων Όρων Χρήσης. Εάν δεν συμφωνείτε με οποιονδήποτε από τους όρους, παρακαλούμε να μην χρησιμοποιήσετε την πλατφόρμα.
              </p>
            </section>

            {/* 2. Περιγραφή Υπηρεσιών */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">2. Περιγραφή Υπηρεσιών</h2>
              <p className="leading-relaxed">
                Η πλατφόρμα παρέχει εκπαιδευτικό υλικό, τεστ προσομοίωσης και εργαλεία τεχνητής νοημοσύνης για την προετοιμασία των υποψηφίων για τις εξετάσεις του Πιστοποιητικού Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ).
              </p>
            </section>

            {/* 3. Λογαριασμοί Χρηστών */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">3. Λογαριασμοί Χρηστών</h2>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>Οι χρήστες είναι υπεύθυνοι για τη διατήρηση της εμπιστευτικότητας των κωδικών πρόσβασής τους.</li>
                <li>Απαγορεύεται αυστηρά η κοινή χρήση λογαριασμών. Κάθε λογαριασμός είναι προσωπικός.</li>
                <li>Διατηρούμε το δικαίωμα να αναστείλουμε ή να τερματίσουμε λογαριασμούς που παραβιάζουν τους όρους χρήσης.</li>
              </ul>
            </section>

            {/* 4. Πνευματική Ιδιοκτησία */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">4. Πνευματική Ιδιοκτησία</h2>
              <p className="leading-relaxed">
                Όλο το περιεχόμενο της πλατφόρμας (κείμενα, λογότυπα, γραφικά, λογισμικό, βίντεο) αποτελεί πνευματική ιδιοκτησία του Politografisi.gr και προστατεύεται από την ελληνική και διεθνή νομοθεσία. Απαγορεύεται η αντιγραφή, αναπαραγωγή ή αναδιανομή του υλικού χωρίς γραπτή άδεια.
              </p>
            </section>

            {/* 5. Συνδρομές και Πληρωμές */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">5. Συνδρομές και Πληρωμές</h2>
              <p className="leading-relaxed">
                Οι υπηρεσίες Premium παρέχονται με εφάπαξ πληρωμή για συγκεκριμένο χρονικό διάστημα (π.χ. 1 μήνας, 3 μήνες). Δεν υπάρχει αυτόματη ανανέωση. Λόγω της ψηφιακής φύσης των προϊόντων, δεν παρέχονται επιστροφές χρημάτων μετά την ενεργοποίηση της υπηρεσίας, εκτός εάν ορίζεται διαφορετικά από τον νόμο.
              </p>
            </section>

            {/* 6. Περιορισμός Ευθύνης */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">6. Περιορισμός Ευθύνης</h2>
              <p className="leading-relaxed">
                Η πλατφόρμα καταβάλλει κάθε δυνατή προσπάθεια για την ακρίβεια του υλικού, ωστόσο δεν εγγυάται την επιτυχία στις εξετάσεις. Η χρήση της πλατφόρμας γίνεται με ευθύνη του χρήστη.
              </p>
            </section>

            {/* 7. Επικοινωνία */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-900">7. Επικοινωνία</h2>
              <p className="leading-relaxed">
                Για απορίες σχετικά με τους όρους χρήσης, μπορείτε να επικοινωνήσετε μαζί μας στο <a href="mailto:support@politografisi.gr" className="text-blue-600 font-bold hover:underline">support@politografisi.gr</a>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}