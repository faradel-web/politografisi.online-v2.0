import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Πολιτική Απορρήτου | Politografisi.online",
    description: "Ενημερωθείτε για το πώς συλλέγουμε και προστατεύουμε τα προσωπικά σας δεδομένα στο Politografisi.online.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
            <Navbar />

            <main className="pt-32 pb-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-blue-950 dark:text-white mb-8">Πολιτική Απορρήτου & Cookies</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-12">Τελευταία ενημέρωση: 10 Μαρτίου 2026</p>

                    <div className="space-y-12 text-slate-700 dark:text-slate-300">

                        {/* 1. Υπεύθυνος Επεξεργασίας */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">1. Υπεύθυνος Επεξεργασίας Δεδομένων</h2>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
                                <p className="leading-relaxed">
                                    <strong className="text-slate-900 dark:text-white">Υπεύθυνος Επεξεργασίας:</strong> Politografisi.online
                                </p>
                                <p className="leading-relaxed mt-2">
                                    <strong className="text-slate-900 dark:text-white">Email επικοινωνίας:</strong>{" "}
                                    <a href="mailto:privacy@politografisi.online" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">privacy@politografisi.online</a>
                                </p>
                                <p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Η παρούσα πολιτική ισχύει τόσο για την ιστοσελίδα (politografisi.online) όσο και για τις εφαρμογές κινητών (Android, iOS), οι οποίες λειτουργούν ως περιβάλλοντα πρόσβασης (WebView) στην ιστοσελίδα.
                                </p>
                            </div>
                        </section>

                        {/* 2. Συλλογή Δεδομένων */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">2. Ποια δεδομένα συλλέγουμε</h2>
                            <p className="leading-relaxed">
                                Συλλέγουμε μόνο τα απαραίτητα δεδομένα για την παροχή των υπηρεσιών μας:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li><strong className="text-slate-900 dark:text-white">Στοιχεία Ταυτοποίησης:</strong> Όνομα, Επίθετο, Email (μέσω εγγραφής ή Google Login).</li>
                                <li><strong className="text-slate-900 dark:text-white">Δεδομένα Προόδου:</strong> Αποτελέσματα τεστ, ιστορικό ασκήσεων, ηχογραφήσεις (για την άσκηση ομιλίας) και κείμενα εκθέσεων.</li>
                                <li><strong className="text-slate-900 dark:text-white">Τεχνικά Δεδομένα:</strong> Διεύθυνση IP, τύπος προγράμματος περιήγησης (browser), cookies.</li>
                            </ul>
                        </section>

                        {/* 3. Πώς χρησιμοποιούμε τα δεδομένα */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">3. Πώς χρησιμοποιούμε τα δεδομένα</h2>
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

                        {/* 4. Νομική Βάση Επεξεργασίας */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">4. Νομική Βάση Επεξεργασίας (GDPR Άρθρο 6)</h2>
                            <p className="leading-relaxed">
                                Επεξεργαζόμαστε τα δεδομένα σας βάσει:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li><strong className="text-slate-900 dark:text-white">Συγκατάθεσης (Consent):</strong> Για cookies αναλυτικών και διαφήμισης (Google Analytics, Meta Pixel).</li>
                                <li><strong className="text-slate-900 dark:text-white">Εκτέλεσης Σύμβασης (Contract):</strong> Για τη λειτουργία του λογαριασμού σας και την παροχή υπηρεσιών.</li>
                                <li><strong className="text-slate-900 dark:text-white">Έννομου Συμφέροντος (Legitimate Interest):</strong> Για την ασφάλεια της πλατφόρμας και τη βελτίωση των υπηρεσιών.</li>
                            </ul>
                        </section>

                        {/* 5. Cookies */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">5. Cookies που χρησιμοποιούμε</h2>
                            <p className="leading-relaxed">
                                Η πλατφόρμα μας χρησιμοποιεί cookies για την ομαλή λειτουργία της, αλλά και για τη μέτρηση της επισκεψιμότητας
                                (Google Analytics) και για λόγους διαφήμισης (Meta Pixel).
                            </p>
                            <ul className="list-disc pl-6 space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mt-4">
                                <li><strong className="text-blue-900 dark:text-blue-300">Αναγκαία (Απαραίτητα):</strong> Βοηθούν στην πλοήγηση και την πρόσβαση σε ασφαλείς περιοχές. Χωρίς αυτά ο ιστότοπος δεν θα λειτουργούσε σωστά. Είναι μόνιμα ενεργοποιημένα.</li>
                                <li><strong className="text-blue-900 dark:text-blue-300">Αναλυτικά (Στατιστικά):</strong> Μας βοηθούν να κατανοήσουμε πώς οι επισκέπτες αλληλεπιδρούν με τον ιστότοπο, μέσω ανώνυμων πληροφοριών (Google Analytics, ID: G-SHLS1S2YM8).</li>
                                <li><strong className="text-blue-900 dark:text-blue-300">Διαφήμιση:</strong> Χρησιμοποιούνται για τον εντοπισμό χρηστών μεταξύ ιστότοπων, με σκοπό την προβολή σχετικών διαφημίσεων (Meta Pixel, ID: 856233920774515).</li>
                            </ul>
                        </section>

                        {/* 6. AI & Τρίτα Μέρη */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">6. Τεχνητή Νοημοσύνη & Υπηρεσίες Τρίτων</h2>
                            <p className="leading-relaxed">
                                Για την αξιολόγηση των ασκήσεων (Writing & Speaking), χρησιμοποιούμε μοντέλα τεχνητής νοημοσύνης (π.χ. Google Gemini). Τα δεδομένα που αποστέλλονται είναι ανωνυμοποιημένα όπου είναι δυνατόν και δεν χρησιμοποιούνται για την εκπαίδευση των μοντέλων τρίτων με τρόπο που να σας ταυτοποιεί.
                                Η πλατφόρμα φιλοξενείται σε ασφαλείς διακομιστές (Firebase/Google Cloud).
                            </p>
                        </section>

                        {/* 7. Μεταφορά Δεδομένων εκτός ΕΟΧ */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">7. Μεταφορά Δεδομένων εκτός ΕΟΧ</h2>
                            <p className="leading-relaxed">
                                Τα δεδομένα σας ενδέχεται να μεταφερθούν και να αποθηκευτούν σε διακομιστές εκτός του Ευρωπαϊκού Οικονομικού Χώρου (ΕΟΧ), κυρίως μέσω των υπηρεσιών Google (Firebase, Google Cloud, Google Analytics) και Meta (Facebook Pixel). Αυτές οι μεταφορές γίνονται βάσει:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li>Τυποποιημένων Συμβατικών Ρητρών (Standard Contractual Clauses - SCCs) σύμφωνα με τον GDPR.</li>
                                <li>Αποφάσεων επάρκειας της Ευρωπαϊκής Επιτροπής (EU-US Data Privacy Framework).</li>
                            </ul>
                        </section>

                        {/* 8. Ασφάλεια Δεδομένων */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">8. Ασφάλεια Δεδομένων</h2>
                            <p className="leading-relaxed">
                                Λαμβάνουμε όλα τα απαραίτητα τεχνικά μέτρα για την προστασία των δεδομένων σας από μη εξουσιοδοτημένη πρόσβαση, απώλεια ή διαρροή. Οι κωδικοί πρόσβασης κρυπτογραφούνται και οι πληρωμές διεκπεραιώνονται από πιστοποιημένους παρόχους χωρίς να αποθηκεύουμε στοιχεία καρτών.
                            </p>
                        </section>

                        {/* 9. Χρόνος Διατήρησης Δεδομένων */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">9. Χρόνος Διατήρησης Δεδομένων</h2>
                            <p className="leading-relaxed">
                                Τα δεδομένα σας διατηρούνται για όσο χρονικό διάστημα ο λογαριασμός σας παραμένει ενεργός. Σε περίπτωση διαγραφής λογαριασμού, τα δεδομένα σας θα διαγραφούν εντός 30 ημερών, εκτός εάν η νομοθεσία απαιτεί τη φύλαξή τους για μεγαλύτερο χρονικό διάστημα (π.χ. δεδομένα τιμολόγησης: 5 έτη).
                            </p>
                        </section>

                        {/* 10. Δικαιώματα Χρηστών (GDPR) */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">10. Τα Δικαιώματά σας (GDPR)</h2>
                            <p className="leading-relaxed">
                                Σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR), έχετε δικαίωμα:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li><strong className="text-slate-900 dark:text-white">Πρόσβαση:</strong> Να ζητήσετε αντίγραφο των δεδομένων σας.</li>
                                <li><strong className="text-slate-900 dark:text-white">Διόρθωση:</strong> Να ζητήσετε τη διόρθωση ανακριβών δεδομένων.</li>
                                <li><strong className="text-slate-900 dark:text-white">Διαγραφή:</strong> Να ζητήσετε τη διαγραφή του λογαριασμού σας («Δικαίωμα στη λήθη»).</li>
                                <li><strong className="text-slate-900 dark:text-white">Φορητότητα:</strong> Να ζητήσετε τη μεταφορά των δεδομένων σας σε άλλον πάροχο.</li>
                                <li><strong className="text-slate-900 dark:text-white">Ανάκληση Συγκατάθεσης:</strong> Να ανακαλέσετε τη συγκατάθεσή σας ανά πάσα στιγμή (π.χ. για cookies).</li>
                            </ul>
                            <p className="mt-4">
                                Για να ασκήσετε τα δικαιώματά σας, επικοινωνήστε στο <a href="mailto:privacy@politografisi.online" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">privacy@politografisi.online</a>.
                            </p>
                        </section>

                        {/* 11. Δικαίωμα Καταγγελίας */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">11. Δικαίωμα Καταγγελίας</h2>
                            <p className="leading-relaxed">
                                Εάν πιστεύετε ότι η επεξεργασία των δεδομένων σας παραβιάζει τον GDPR, έχετε δικαίωμα να υποβάλετε καταγγελία στην <strong className="text-slate-900 dark:text-white">Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (ΑΠΔΠΧ)</strong>:
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 mt-2">
                                <p className="text-sm">Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα</p>
                                <p className="text-sm">Κηφισίας 1-3, 115 23, Αθήνα</p>
                                <p className="text-sm">Τηλ: +30 210 6475600</p>
                                <p className="text-sm">
                                    <a href="https://www.dpa.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">www.dpa.gr</a>
                                </p>
                            </div>
                        </section>

                        {/* 12. Διαχείριση Cookies */}
                        <section className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">12. Διαχείριση Cookies</h2>
                            <p className="leading-relaxed">
                                Μέσω του αναδυόμενου παραθύρου (banner) μπορείτε ανά πάσα στιγμή να διαχειριστείτε τις ρυθμίσεις σας και να απορρίψετε
                                τα μη απαραίτητα cookies. Μπορείτε επίσης να διαγράψετε τα cookies μέσω των ρυθμίσεων του προγράμματος περιήγησής σας.
                            </p>
                        </section>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
