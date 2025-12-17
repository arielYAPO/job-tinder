'use client'
import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Loader2, FileDown } from 'lucide-react';
import createClient from '@/lib/supabase/client';

// =============================================================================
// CLASSIC SINGLE COLUMN ATS TEMPLATE
// Based on CV_TEMPLATE_GUIDE.json specification
// =============================================================================

// Colors
const colors = {
    textPrimary: '#1a1a1a',
    textSecondary: '#374151',
    muted: '#6b7280',
    accent: '#2563eb',
    divider: '#e5e7eb',
    black: '#000000',
};

// Typography following the guide
const styles = StyleSheet.create({
    // Page
    page: {
        padding: 45, // ~16mm
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: colors.textPrimary,
        backgroundColor: '#ffffff',
    },

    // ===================
    // HEADER SECTION
    // ===================
    header: {
        marginBottom: 16,
        textAlign: 'center',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    contactItem: {
        fontSize: 9,
        color: colors.muted,
    },
    contactSeparator: {
        fontSize: 9,
        color: colors.muted,
        marginHorizontal: 4,
    },

    // ===================
    // SECTION STYLES
    // ===================
    section: {
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.black,
        paddingBottom: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.black,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // ===================
    // SUMMARY
    // ===================
    summaryText: {
        fontSize: 10,
        lineHeight: 1.5,
        color: colors.textSecondary,
        textAlign: 'justify',
    },

    // ===================
    // KEY SKILLS
    // ===================
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    skillItem: {
        fontSize: 9,
        color: colors.textSecondary,
        backgroundColor: '#f3f4f6',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 3,
    },

    // ===================
    // EXPERIENCE
    // ===================
    expItem: {
        marginBottom: 12,
    },
    expHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    expTitleCompany: {
        flexDirection: 'row',
        flex: 1,
    },
    expTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.black,
    },
    expCompanyDivider: {
        fontSize: 11,
        color: colors.muted,
        marginHorizontal: 6,
    },
    expCompany: {
        fontSize: 11,
        color: colors.accent,
    },
    expDateLocation: {
        fontSize: 9,
        color: colors.muted,
        textAlign: 'right',
    },
    bulletContainer: {
        marginTop: 4,
        marginLeft: 8,
    },
    bullet: {
        fontSize: 10,
        color: colors.textSecondary,
        marginBottom: 3,
        lineHeight: 1.4,
    },

    // ===================
    // EDUCATION
    // ===================
    eduItem: {
        marginBottom: 8,
    },
    eduHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    eduDegree: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.black,
    },
    eduSchool: {
        fontSize: 10,
        color: colors.accent,
    },
    eduYear: {
        fontSize: 9,
        color: colors.muted,
    },

    // ===================
    // KEYWORDS FOOTER
    // ===================
    keywordsSection: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    keywordsTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.muted,
        marginBottom: 4,
    },
    keywordsText: {
        fontSize: 8,
        color: colors.muted,
    },
});

// =============================================================================
// PDF DOCUMENT COMPONENT
// =============================================================================
function CVPDFDocument({ cvData, profileName, location, email, phone, linkedin, github, portfolio }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ============ HEADER ============ */}
                <View style={styles.header}>
                    <Text style={styles.name}>{profileName || 'Your Name'}</Text>

                    {/* Tailored Title (AI-generated) */}
                    {cvData?.tailored_title && (
                        <Text style={styles.subtitle}>{cvData.tailored_title}</Text>
                    )}

                    {/* Contact Row 1: Location | Email | Phone */}
                    <View style={styles.contactRow}>
                        {phone && (
                            <>
                                <Text style={styles.contactItem}>{phone}</Text>
                                <Text style={styles.contactSeparator}>|</Text>
                            </>
                        )}
                        {email && (
                            <>
                                <Text style={styles.contactItem}>{email}</Text>
                                {location && <Text style={styles.contactSeparator}>|</Text>}
                            </>
                        )}
                        {location && (
                            <Text style={styles.contactItem}>{location}</Text>
                        )}
                    </View>

                    {/* Contact Row 2: LinkedIn | GitHub | Portfolio */}
                    {(linkedin || github || portfolio) && (
                        <View style={[styles.contactRow, { marginTop: 4 }]}>
                            {linkedin && (
                                <>
                                    <Text style={styles.contactItem}>{linkedin}</Text>
                                    {(github || portfolio) && <Text style={styles.contactSeparator}>|</Text>}
                                </>
                            )}
                            {github && (
                                <>
                                    <Text style={styles.contactItem}>{github}</Text>
                                    {portfolio && <Text style={styles.contactSeparator}>|</Text>}
                                </>
                            )}
                            {portfolio && (
                                <Text style={styles.contactItem}>{portfolio}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* ============ PROFESSIONAL SUMMARY ============ */}
                {cvData?.professional_summary && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Profil Professionnel</Text>
                        </View>
                        <Text style={styles.summaryText}>{cvData.professional_summary}</Text>
                    </View>
                )}

                {/* ============ KEY COMPETENCIES / SKILLS ============ */}
                {cvData?.skills && cvData.skills.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Compétences Clés</Text>
                        </View>
                        <View style={styles.skillsContainer}>
                            {cvData.skills.map((skill, index) => (
                                <Text key={index} style={styles.skillItem}>{skill}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* ============ PROFESSIONAL EXPERIENCE ============ */}
                {cvData?.work_experience && cvData.work_experience.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Expérience Professionnelle</Text>
                        </View>
                        {cvData.work_experience.map((exp, index) => (
                            <View key={index} style={styles.expItem}>
                                <View style={styles.expHeaderRow}>
                                    <View style={styles.expTitleCompany}>
                                        <Text style={styles.expTitle}>{exp.title}</Text>
                                        <Text style={styles.expCompanyDivider}>|</Text>
                                        <Text style={styles.expCompany}>{exp.company}</Text>
                                    </View>
                                    <Text style={styles.expDateLocation}>{exp.duration}</Text>
                                </View>
                                <View style={styles.bulletContainer}>
                                    {exp.bullets?.map((bullet, i) => (
                                        <Text key={i} style={styles.bullet}>• {bullet}</Text>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* ============ EDUCATION ============ */}
                {cvData?.education && cvData.education.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Formation</Text>
                        </View>
                        {cvData.education.map((edu, index) => (
                            <View key={index} style={styles.eduItem}>
                                <View style={styles.eduHeaderRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.eduDegree}>
                                            {edu.degree}{edu.field ? ` — ${edu.field}` : ''}
                                        </Text>
                                        <Text style={styles.eduSchool}>{edu.school}</Text>
                                    </View>
                                    <Text style={styles.eduYear}>
                                        {edu.year && edu.year.toString().length <= 2 ? `20${edu.year}` : edu.year}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* ============ PROJECTS ============ */}
                {cvData?.projects && cvData.projects.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Projets</Text>
                        </View>
                        {cvData.projects.map((proj, index) => (
                            <View key={index} style={styles.expItem}>
                                <Text style={styles.expTitle}>{proj.title}</Text>
                                {proj.tech_stack && proj.tech_stack.length > 0 && (
                                    <Text style={{ fontSize: 9, color: colors.accent, marginTop: 2, marginBottom: 4 }}>
                                        {proj.tech_stack.join(' • ')}
                                    </Text>
                                )}
                                {proj.description && (
                                    <Text style={styles.bullet}>• {proj.description}</Text>
                                )}
                                {proj.bullets && proj.bullets.length > 0 && (
                                    <View style={styles.bulletContainer}>
                                        {proj.bullets.map((bullet, i) => (
                                            <Text key={i} style={styles.bullet}>• {bullet}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* ============ CERTIFICATIONS ============ */}
                {cvData?.certifications && cvData.certifications.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Certifications</Text>
                        </View>
                        {cvData.certifications.map((cert, index) => (
                            <View key={index} style={styles.eduItem}>
                                <Text style={styles.eduDegree}>{cert.name}</Text>
                                {cert.issuer && (
                                    <Text style={styles.eduSchool}>{cert.issuer}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* ============ LANGUAGES ============ */}
                {cvData?.languages && cvData.languages.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Langues</Text>
                        </View>
                        <View style={styles.skillsContainer}>
                            {cvData.languages.map((lang, index) => (
                                <Text key={index} style={styles.skillItem}>{lang}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* ============ ATS KEYWORDS ============ */}
                {cvData?.matched_keywords && cvData.matched_keywords.length > 0 && (
                    <View style={styles.keywordsSection}>
                        <Text style={styles.keywordsTitle}>Mots-clés ATS :</Text>
                        <Text style={styles.keywordsText}>
                            {cvData.matched_keywords.join(' | ')}
                        </Text>
                    </View>
                )}

            </Page>
        </Document>
    );
}

// =============================================================================
// DOWNLOAD BUTTON COMPONENT
// =============================================================================
export default function CVDownloadButton({ cvContent, jobTitle, profileName, location, email, phone, linkedin, github, portfolio }) {
    const [isClient, setIsClient] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            // Parse the CV JSON
            let cvData;
            try {
                cvData = JSON.parse(cvContent);
            } catch {
                cvData = { professional_summary: cvContent };
            }

            console.log('CV Data for PDF:', cvData);

            // Generate PDF blob
            console.log('📄 Starting PDF generation...');
            const blob = await pdf(
                <CVPDFDocument
                    cvData={cvData}
                    profileName={profileName}
                    location={location}
                    email={email}
                    phone={phone}
                    linkedin={linkedin}
                    github={github}
                    portfolio={portfolio}
                />
            ).toBlob();
            console.log('✅ PDF blob created:', blob.size, 'bytes');

            // Create proper PDF blob with explicit MIME type
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const fileName = `CV_${(jobTitle || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            console.log('📁 Filename:', fileName);

            // Download using FileSaver approach (more reliable)
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = fileName;
            link.setAttribute('download', fileName); // Force download attribute
            document.body.appendChild(link);

            console.log('⬇️ Triggering download...');
            link.click();

            // Cleanup after small delay to ensure download starts
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            console.log('✅ Download triggered successfully!');

            // Track download in profiles for checklist
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { error } = await supabase.from('profiles').update({ has_downloaded_cv: true }).eq('user_id', user.id);
                    if (error) {
                        console.error('❌ Failed to update has_downloaded_cv:', error);
                    } else {
                        console.log('✅ Checklist flag updated: has_downloaded_cv = true');
                    }
                }
            } catch (e) {
                console.log('Could not track download:', e);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + error.message);
        }
        setDownloading(false);
    };

    if (!isClient) return null;

    return (
        <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-lg hover:glow-primary transition text-sm disabled:opacity-50 flex items-center gap-2"
        >
            {downloading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Génération...
                </>
            ) : (
                <>
                    <FileDown className="w-4 h-4" /> Télécharger CV
                </>
            )}
        </button>
    );
}
