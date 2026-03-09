import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Όροι Χρήσης | Politografisi.online",
  description: "Διαβάστε τους όρους χρήσης της πλατφόρμας προετοιμασίας για τις εξετάσεις πολιτογράφησης.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-black text-blue-950 dark:text-white mb-8">Όροι Χρήσης</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-12">Τελευταία ενημέρωση: 10 Μαρτίου 2026</p>

          <div className="space-y-12 text-slate-700 dark:text-slate-300">

            {/* 1. Εισαγωγή */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">1. Εισαγωγή</h2>
              <p className="leading-relaxed">
                Καλώς ήρθατε στο Politografisi.online. Η χρήση της ιστοσελίδας, των εφαρμογών κινητών (Android, iOS) και των υπηρεσιών μας συνεπάγεται την πλήρη και ανεπιφύλακτη αποδοχή των παρόντων Όρων Χρήσης. Εάν δεν συμφωνείτε με οποιονδήποτε από τους όρους, παρακαλούμε να μην χρησιμοποιήσετε την πλατφόρμα.
              </p>
              <p className="leading-relaxed">
                Οι παρόντες όροι ισχύουν τόσο για την ιστοσελίδα (politografisi.online) όσο και για τις εφαρμογές κινητών (Android, iOS), οι οποίες λειτουργούν ως περιβάλλοντα πρόσβασης (WebView) στην ιστοσελίδα.
              </p>
            </section>

            {/* 2. Περιγραφή Υπηρεσιών */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">2. Περιγραφή Υπηρεσιών</h2>
              <p className="leading-relaxed">
                Η πλατφόρμα παρέχει εκπαιδευτικό υλικό, τεστ προσομοίωσης και εργαλεία τεχνητής νοημοσύνης για την προετοιμασία των υποψηφίων για τις εξετάσεις του Πιστοποιητικού Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ).
              </p>
            </section>

            {/* 3. Ακρίβεια Περιεχομένου & Αποποίηση Ευθύνης */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">3. Ακρίβεια Περιεχομένου</h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 sm:p-8">
                <p className="leading-relaxed font-medium text-amber-900 dark:text-amber-200">
                  ⚠️ Παρόλο που καταβάλλουμε κάθε δυνατή προσπάθεια για την ακρίβεια και την ενημέρωση του εκπαιδευτικού υλικού, οι ερωτήσεις, οι απαντήσεις και το θεωρητικό περιεχόμενο ενδέχεται να περιέχουν σφάλματα, ανακρίβειες ή παρωχημένες πληροφορίες.
                </p>
                <ul className="list-disc pl-5 space-y-2 leading-relaxed mt-4 text-amber-800 dark:text-amber-300">
                  <li>Η πλατφόρμα <strong>δεν αποτελεί επίσημη πηγή</strong> και δεν υποκαθιστά τα εγκεκριμένα εκπαιδευτικά υλικά του Υπουργείου Εσωτερικών ή του ΠΕΓΠ.</li>
                  <li>Τα τεστ προσομοίωσης είναι <strong>ενδεικτικά</strong> και ενδέχεται να μην αντικατοπτρίζουν απόλυτα τη μορφή ή το περιεχόμενο των πραγματικών εξετάσεων.</li>
                  <li>Συνιστούμε στους χρήστες να <strong>επαληθεύουν τις πληροφορίες από επίσημες πηγές</strong> πριν τις εξετάσεις.</li>
                </ul>
              </div>
            </section>

            {/* 4. Τεχνητή Νοημοσύνη (AI) */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">4. Χρήση Τεχνητής Νοημοσύνης (AI)</h2>
              <p className="leading-relaxed">
                Ορισμένες λειτουργίες της πλατφόρμας (αξιολόγηση γραπτού λόγου, εκτίμηση προφορικής έκφρασης, δημιουργία ερωτήσεων εξάσκησης) χρησιμοποιούν μοντέλα τεχνητής νοημοσύνης (AI).
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>Οι αξιολογήσεις AI είναι <strong>ενδεικτικές</strong> και δεν αποτελούν επίσημη βαθμολόγηση.</li>
                <li>Τα αποτελέσματα AI ενδέχεται να μην αντικατοπτρίζουν πάντα με ακρίβεια το πραγματικό επίπεδο του χρήστη.</li>
                <li>Το AI-generated περιεχόμενο ελέγχεται αλλά ενδέχεται να περιέχει ανακρίβειες.</li>
              </ul>
            </section>

            {/* 5. Λογαριασμοί Χρηστών */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">5. Λογαριασμοί Χρηστών</h2>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>Οι χρήστες είναι υπεύθυνοι για τη διατήρηση της εμπιστευτικότητας των κωδικών πρόσβασής τους.</li>
                <li>Απαγορεύεται αυστηρά η κοινή χρήση λογαριασμών. Κάθε λογαριασμός είναι προσωπικός.</li>
                <li>Διατηρούμε το δικαίωμα να αναστείλουμε ή να τερματίσουμε λογαριασμούς που παραβιάζουν τους όρους χρήσης.</li>
              </ul>
            </section>

            {/* 6. Ηλικιακοί Περιορισμοί */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">6. Ηλικιακοί Περιορισμοί</h2>
              <p className="leading-relaxed">
                Η πλατφόρμα απευθύνεται σε χρήστες ηλικίας 16 ετών και άνω. Χρήστες κάτω των 16 ετών πρέπει να έχουν τη συγκατάθεση γονέα ή κηδεμόνα για τη χρήση των υπηρεσιών μας, σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR).
              </p>
            </section>

            {/* 7. Πνευματική Ιδιοκτησία */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">7. Πνευματική Ιδιοκτησία</h2>
              <p className="leading-relaxed">
                Όλο το περιεχόμενο της πλατφόρμας (κείμενα, λογότυπα, γραφικά, λογισμικό, βίντεο) αποτελεί πνευματική ιδιοκτησία του Politografisi.online και προστατεύεται από την ελληνική και διεθνή νομοθεσία. Απαγορεύεται η αντιγραφή, αναπαραγωγή ή αναδιανομή του υλικού χωρίς γραπτή άδεια.
              </p>
            </section>

            {/* 8. Συνδρομές και Πληρωμές */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">8. Συνδρομές και Πληρωμές</h2>
              <p className="leading-relaxed">
                Οι υπηρεσίες Premium παρέχονται με εφάπαξ πληρωμή για συγκεκριμένο χρονικό διάστημα (π.χ. 1 μήνας, 3 μήνες). Δεν υπάρχει αυτόματη ανανέωση. Λόγω της ψηφιακής φύσης των προϊόντων, δεν παρέχονται επιστροφές χρημάτων μετά την ενεργοποίηση της υπηρεσίας, εκτός εάν ορίζεται διαφορετικά από τον νόμο.
              </p>
            </section>

            {/* 9. Περιορισμός Ευθύνης */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">9. Περιορισμός Ευθύνης</h2>
              <p className="leading-relaxed">
                Η πλατφόρμα καταβάλλει κάθε δυνατή προσπάθεια για την ακρίβεια του υλικού, ωστόσο:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>Δεν εγγυάται την επιτυχία στις εξετάσεις ΠΕΓΠ.</li>
                <li>Δεν ευθύνεται για τυχόν σφάλματα ή ανακρίβειες στο εκπαιδευτικό υλικό.</li>
                <li>Δεν ευθύνεται για τεχνικά προβλήματα ή διακοπές λειτουργίας λόγω ανωτέρας βίας.</li>
                <li>Η χρήση της πλατφόρμας γίνεται με αποκλειστική ευθύνη του χρήστη.</li>
              </ul>
            </section>

            {/* 10. Τροποποίηση Όρων */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">10. Τροποποίηση Όρων</h2>
              <p className="leading-relaxed">
                Διατηρούμε το δικαίωμα να τροποποιήσουμε τους παρόντες όρους ανά πάσα στιγμή. Οι αλλαγές θα δημοσιεύονται σε αυτή τη σελίδα με ενημερωμένη ημερομηνία. Η συνέχιση της χρήσης της πλατφόρμας μετά τις αλλαγές συνιστά αποδοχή των νέων όρων.
              </p>
            </section>

            {/* 11. Εφαρμοστέο Δίκαιο */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">11. Εφαρμοστέο Δίκαιο</h2>
              <p className="leading-relaxed">
                Οι παρόντες όροι διέπονται από το ελληνικό δίκαιο. Αρμόδια δικαστήρια για κάθε διαφορά που τυχόν προκύψει είναι τα δικαστήρια της Αθήνας.
              </p>
            </section>

            {/* 12. Επικοινωνία */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">12. Επικοινωνία</h2>
              <p className="leading-relaxed">
                Για απορίες σχετικά με τους όρους χρήσης, μπορείτε να επικοινωνήσετε μαζί μας στο <a href="mailto:support@politografisi.online" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">support@politografisi.online</a>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}