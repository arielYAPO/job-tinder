'use client'
import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Link } from '@react-pdf/renderer';
import { Loader2, FileText } from 'lucide-react';

// =============================================================================
// MODERN FRENCH COVER LETTER PDF TEMPLATE
// Matching CV styling - Clean, minimal, professional
// =============================================================================

// Colors (matching CV)
const colors = {
    textPrimary: '#111111',
    textSecondary: '#5A5A5A',
    divider: '#E6E6E6',
    accent: '#1E5BD6',
    pillBg: '#F3F4F6',
    white: '#ffffff',
    black: '#000000',
};

// Typography - matching the spec
const styles = StyleSheet.create({
    page: {
        padding: 50, // ~18mm
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: colors.textPrimary,
        backgroundColor: colors.white,
    },

    // =====================
    // HEADER BLOCK
    // =====================
    header: {
        marginBottom: 18,
        textAlign: 'center',
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.black,
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },
    contactPill: {
        fontSize: 9,
        color: colors.textSecondary,
        backgroundColor: colors.pillBg,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    contactLink: {
        fontSize: 9,
        color: colors.accent,
        backgroundColor: colors.pillBg,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
        textDecoration: 'none',
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 14,
    },

    // =====================
    // META BLOCK (Date + Company)
    // =====================
    metaBlock: {
        marginBottom: 6,
    },
    metaDate: {
        fontSize: 10,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    metaTarget: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 10,
    },
    greeting: {
        fontSize: 11,
        color: colors.textPrimary,
        marginBottom: 14,
    },

    // =====================
    // BODY PARAGRAPHS
    // =====================
    paragraph: {
        fontSize: 10.5,
        color: colors.textSecondary,
        lineHeight: 1.5,
        marginBottom: 10,
        textAlign: 'left',
    },

    // =====================
    // SIGNATURE BLOCK
    // =====================
    closing: {
        fontSize: 11,
        color: colors.textSecondary,
        lineHeight: 1.6,
        marginTop: 18,
        marginBottom: 24,
    },
    signatureName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.black,
    },
});

// =============================================================================
// PDF DOCUMENT COMPONENT - Modern French Cover Letter
// =============================================================================
function CoverLetterPDFDocument({ letterData, profile, job }) {
    // Parse the cover letter text into paragraphs
    let paragraphs = [];
    let greeting = 'Madame, Monsieur,';
    let closing = 'Veuillez agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.';
    let signatureName = profile?.full_name || 'Signature';

    if (typeof letterData === 'string') {
        // Split by newlines
        let lines = letterData.split('\n').filter(l => l.trim());

        // Filter out header/contact info lines that would duplicate
        lines = lines.filter(line => {
            const lower = line.toLowerCase();
            // Skip lines that look like header info
            if (lower.includes('@gmail') || lower.includes('@') && lower.includes('.com')) return false;
            if (lower.includes('linkedin.com') || lower.includes('github.com')) return false;
            if (lower.includes('+33') || lower.match(/^\+?\d{10,}/)) return false;
            if (line.match(/^\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}$/i)) return false;
            if (lower.includes('paris, france') || lower.includes('france •')) return false;
            if (line.match(/^[A-Z\s]{5,}$/) && line === line.toUpperCase()) return false; // All caps names
            if (lower.includes('ariel yapo') && line.length < 30) return false;
            if (lower.includes('— développeur') || lower.includes('- développeur')) return false;
            if (lower.includes('openclassrooms —') && !lower.includes('rejoindre')) return false;
            return true;
        });

        // Try to detect greeting
        if (lines.length > 0 && (lines[0].includes('Madame') || lines[0].includes('Monsieur'))) {
            const firstLine = lines[0];
            if (firstLine.length < 50) {
                greeting = lines.shift();
            }
        }

        // Try to detect closing (formal salutation)
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('salutations distinguées') || lines[i].includes('agréer')) {
                closing = lines[i];
                lines.splice(i, 1);
                break;
            }
        }

        // Signature name (short line at end without period)
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            if (lastLine.length < 40 && !lastLine.includes('.') && !lastLine.includes(',')) {
                signatureName = lines.pop();
            }
        }

        // Remaining lines are body paragraphs
        paragraphs = lines.filter(l => l.length > 20); // Filter out very short lines
    }


    // Get today's date in French
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Build subtitle from job info
    const subtitle = job?.title ? `${job.title} · En alternance` : 'Candidature en alternance';

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ============ HEADER ============ */}
                <View style={styles.header}>
                    <Text style={styles.name}>{profile?.full_name || 'CANDIDAT'}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    {/* Contact Pills Row 1 */}
                    <View style={styles.contactRow}>
                        {profile?.location && (
                            <Text style={styles.contactPill}>{profile.location}</Text>
                        )}
                        {profile?.phone && (
                            <Text style={styles.contactPill}>{profile.phone}</Text>
                        )}
                        {profile?.email && (
                            <Text style={styles.contactPill}>{profile.email}</Text>
                        )}
                    </View>

                    {/* Contact Pills Row 2 (Links) */}
                    {(profile?.linkedin_url || profile?.github_url || profile?.portfolio_url) && (
                        <View style={styles.contactRow}>
                            {profile?.linkedin_url && (
                                <Text style={styles.contactLink}>{profile.linkedin_url}</Text>
                            )}
                            {profile?.github_url && (
                                <Text style={styles.contactLink}>{profile.github_url}</Text>
                            )}
                            {profile?.portfolio_url && (
                                <Text style={styles.contactLink}>{profile.portfolio_url}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* ============ META BLOCK ============ */}
                <View style={styles.metaBlock}>
                    <Text style={styles.metaDate}>{today}</Text>
                    <Text style={styles.metaTarget}>
                        {job?.company_name || 'Entreprise'} — {job?.title || 'Poste'}
                    </Text>
                </View>

                {/* Greeting */}
                <Text style={styles.greeting}>{greeting}</Text>

                {/* ============ BODY PARAGRAPHS ============ */}
                {paragraphs.map((para, index) => (
                    <Text key={index} style={styles.paragraph}>{para}</Text>
                ))}

                {/* ============ CLOSING ============ */}
                <Text style={styles.closing}>{closing}</Text>

                {/* Signature */}
                <Text style={styles.signatureName}>{signatureName}</Text>

            </Page>
        </Document>
    );
}

// =============================================================================
// DOWNLOAD BUTTON COMPONENT
// =============================================================================
export default function CoverLetterDownloadButton({ coverLetterContent, jobTitle, profile, job }) {
    const [isClient, setIsClient] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            // Parse the cover letter JSON
            let letterData = '';
            try {
                const parsed = JSON.parse(coverLetterContent);
                // New format: { "cover_letter": "...", "missing_info_questions": [] }
                if (parsed.cover_letter) {
                    letterData = parsed.cover_letter;
                } else {
                    letterData = coverLetterContent;
                }
            } catch {
                // If not JSON, use as-is
                letterData = coverLetterContent;
            }

            console.log('Cover Letter Data for PDF:', letterData);

            // Generate PDF blob
            const blob = await pdf(
                <CoverLetterPDFDocument
                    letterData={letterData}
                    profile={profile}
                    job={job}
                />
            ).toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Lettre_Motivation_${jobTitle?.replace(/\s+/g, '_') || 'Candidature'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating cover letter PDF:', error);
            alert('Erreur lors de la génération du PDF: ' + error.message);
        }
        setDownloading(false);
    };

    if (!isClient) return null;

    return (
        <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-[var(--secondary)] text-white font-medium rounded-lg hover:glow-secondary transition text-sm disabled:opacity-50 flex items-center gap-2"
        >
            {downloading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Génération...
                </>
            ) : (
                <>
                    <FileText className="w-4 h-4" /> Lettre
                </>
            )}
        </button>
    );
}
