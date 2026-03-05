import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Πολιτική Απορρήτου",
    description: "Ενημερωθείτε για το πώς συλλέγουμε και προστατεύουμε τα προσωπικά σας δεδομένα στο Politografisi.online.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
            <Navbar />

            <main className="pt-32 pb-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-blue-950 dark:text-white mb-8">Πολιτική Απορρήτου & Cookies</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-12">Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}</p>

                    <div className="space-y-12 text-slate-700 dark:text-slate-300">

                        {/* 1. Συλλογή Δεδομένων */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">1. Ποια δεδομένα συλλέγουμε</h2>
                            <p className="leading-relaxed">
                                Συλλέγουμε μόνο τα απαραίτητα δεδομένα για την παροχή των υπηρεσιών μας:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li><strong className="text-slate-900 dark:text-white">Στοιχεία Ταυτοποίησης:</strong> Όνομα, Επίθετο, Email (μέσω εγγραφής ή Google Login).</li>
                                <li><strong className="text-slate-900 dark:text-white">Δεδομένα Προόδου:</strong> Αποτελέσματα τεστ, ιστορικό ασκήσεων, ηχογραφήσεις (για την άσκηση ομιλίας) και κείμενα εκθέσεων.</li>
                                <li><strong className="text-slate-900 dark:text-white">Τεχνικά Δεδομένα:</strong> Διεύθυνση IP, τύπος προγράμματος περιήγησης (browser), cookies.</li>
                            </ul>
                        </section>

                        {/* 2. Χρήση Δεδομένων */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">2. Πώς χρησιμοποιούμε τα δεδομένα</h2>
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

                        {/* 3. Cookies */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">3. Cookies που χρησιμοποιούμε</h2>
                            <p className="leading-relaxed">
                                Η πλατφόρμα μας χρησιμοποιεί cookies για την ομαλή λειτουργία της, αλλά και για τη μέτρηση της επισκεψιμότητας
                                (Google Analytics) και για λόγους διαφήμισης (Meta Pixel).
                            </p>
                            <ul className="list-disc pl-6 space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mt-4">
                                <li><strong className="text-blue-900 dark:text-blue-300">Αναγκαία (Απαραίτητα):</strong> Βοηθούν στην πλοήγηση και την πρόσβαση σε ασφαλείς περιοχές. Χωρίς αυτά ο ιστότοπος δεν θα λειτουργούσε σωστά. Είναι μόνιμα ενεργοποιημένα.</li>
                                <li><strong className="text-blue-900 dark:text-blue-300">Αναλυτικά (Στατιστικά):</strong> Μας βοηθούν να κατανοήσουμε πώς οι επισκέπτες αλληλεπιδρούν με τον ιστότοπο, μέσω ανώνυμων πληροφοριών (Google Analytics).</li>
                                <li><strong className="text-blue-900 dark:text-blue-300">Διαφήμιση:</strong> Χρησιμοποιούνται για τον εντοπισμό χρηστών μεταξύ ιστότοπων, με σκοπό την προβολή αυστηρά σχετικών διαφημίσεων (Meta Pixel).</li>
                            </ul>
                        </section>

                        {/* 4. AI & Τρίτα Μέρη */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">4. Τεχνητή Νοημοσύνη & Υπηρεσίες Τρίτων</h2>
                            <p className="leading-relaxed">
                                Για την αξιολόγηση των ασκήσεων (Writing & Speaking), χρησιμοποιούμε μοντέλα τεχνητής νοημοσύνης (π.χ. Google Gemini). Τα δεδομένα που αποστέλλονται είναι ανωνυμοποιημένα όπου είναι δυνατόν και δεν χρησιμοποιούνται για την εκπαίδευση των μοντέλων τρίτων με τρόπο που να σας ταυτοποιεί.
                                Η πλατφόρμα φιλοξενείται σε ασφαλείς διακομιστές (Firebase/Google Cloud).
                            </p>
                        </section>

                        {/* 5. Ασφάλεια */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">5. Ασφάλεια Δεδομένων</h2>
                            <p className="leading-relaxed">
                                Λαμβάνουμε όλα τα απαραίτητα τεχνικά μέτρα για την προστασία των δεδομένων σας από μη εξουσιοδοτημένη πρόσβαση, απώλεια ή διαρροή. Οι κωδικοί πρόσβασης κρυπτογραφούνται και οι πληρωμές διεκπεραιώνονται από πιστοποιημένους παρόχους χωρίς να αποθηκεύουμε στοιχεία καρτών.
                            </p>
                        </section>

                        {/* 6. Δικαιώματα Χρηστών */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">6. Τα Δικαιώματά σας (GDPR)</h2>
                            <p className="leading-relaxed">
                                Σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR), έχετε δικαίωμα:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li>Να ζητήσετε αντίγραφο των δεδομένων σας.</li>
                                <li>Να ζητήσετε τη διόρθωση ή τη διαγραφή του λογαριασμού σας («Δικαίωμα στη λήθη»).</li>
                                <li>Να ανακαλέσετε τη συγκατάθεσή σας ανά πάσα στιγμή.</li>
                            </ul>
                            <p className="mt-4">
                                Για να ασκήσετε τα δικαιώματά σας, επικοινωνήστε στο <a href="mailto:privacy@politografisi.online" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">privacy@politografisi.online</a>.
                            </p>
                        </section>

                        {/* 7. Διαχείριση Cookies */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">7. Διαχείριση Cookies</h2>
                            <p className="leading-relaxed">
                                Μέσω του αναδυόμενου παραθύρου (banner) μπορείτε ανά πάσα στιγμή να διαχειριστείτε τις ρυθμίσεις σας και να απορρίψετε
                                τα μη απαραίτητα cookies.
                            </p>
                        </section>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
