import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = {
    title: "Πολιτική Απορρήτου | Politografisi.online",
    description: "Πολιτική απορρήτου και χρήση cookies.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-32 pt-40">
                <h1 className="text-4xl font-black mb-8 text-blue-950">Πολιτική Απορρήτου & Cookies</h1>
                <div className="prose prose-blue max-w-none space-y-6 text-slate-700 leading-relaxed font-medium">
                    <p>
                        Η προστασία των προσωπικών σας δεδομένων είναι σημαντική για εμάς. Σε αυτή την πολιτική εξηγούμε
                        πώς συλλέγουμε και χρησιμοποιούμε τα δεδομένα σας (συμπεριλαμβανομένων των cookies).
                    </p>

                    <h2 className="text-2xl font-black text-slate-900 mt-12 mb-6">1. Cookies που χρησιμοποιούμε</h2>
                    <p>
                        Η πλατφόρμα μας χρησιμοποιεί cookies για την ομαλή λειτουργία της, αλλά και για τη μέτρηση της επισκεψιμότητας
                        (Google Analytics) και για λόγους διαφήμισης (Meta Pixel).
                    </p>
                    <ul className="list-disc pl-6 space-y-3 bg-white p-8 rounded-2xl border border-slate-200 mt-4">
                        <li><strong className="text-blue-900">Αναγκαία (Απαραίτητα):</strong> Βοηθούν στην πλοήγηση και την πρόσβαση σε ασφαλείς περιοχές. Χωρίς αυτά ο ιστότοπος δεν θα λειτουργούσε σωστά. Είναι μόνιμα ενεργοποιημένα.</li>
                        <li><strong className="text-blue-900">Αναλυτικά (Στατιστικά):</strong> Μας βοηθούν να κατανοήσουμε πώς οι επισκέπτες αλληλεπιδρούν με τον ιστότοπο, μέσω ανώνυμων πληροφοριών (Google Analytics).</li>
                        <li><strong className="text-blue-900">Διαφήμιση:</strong> Χρησιμοποιούνται για τον εντοπισμό χρηστών μεταξύ ιστότοπων, με σκοπό την προβολή αυστηρά σχετικών διαφημίσεων (Meta Pixel).</li>
                    </ul>

                    <h2 className="text-2xl font-black text-slate-900 mt-12 mb-6">2. Διαχείριση Cookies</h2>
                    <p>
                        Μέσω του αναδυόμενου παραθύρου (banner) μπορείτε ανά πάσα στιγμή να διαχειριστείτε τις ρυθμίσεις σας και να απορρίψετε
                        τα μη απαραίτητα cookies.
                    </p>

                    <h2 className="text-2xl font-black text-slate-900 mt-12 mb-6">3. Τα Δικαιώματά σας (GDPR)</h2>
                    <p>
                        Σύμφωνα με τον Γενικό Κανονισμό για την Προστασία Δεδομένων (GDPR), έχετε το δικαίωμα πρόσβασης,
                        διαγραφής ή περιορισμού της χρήσης των προσωπικών σας δεδομένων όσον αφορά την ανάλυση και τη διαφήμιση.
                    </p>

                    <p className="pt-12 text-sm text-slate-500 font-bold uppercase tracking-wide">
                        Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
