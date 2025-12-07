'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles (like CSS but for PDF)
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: '#333',
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    contactInfo: {
        fontSize: 10,
        color: '#666',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 4,
        textTransform: 'uppercase',
    },
    summaryText: {
        lineHeight: 1.4,
    },
    jobTitle: {
        fontWeight: 'bold',
        fontSize: 11,
    },
    company: {
        fontSize: 10,
        color: '#555',
        marginBottom: 4,
    },
    duration: {
        fontSize: 9,
        color: '#777',
        marginBottom: 5,
    },
    bullet: {
        marginLeft: 10,
        marginBottom: 3,
        lineHeight: 1.3,
    },
    expItem: {
        marginBottom: 12,
    },
    eduItem: {
        marginBottom: 8,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skill: {
        marginRight: 10,
        marginBottom: 3,
    },
});

// The CV Document component
function CVDocument({ cvData, profile }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with name and contact */}
                <View style={styles.header}>
                    <Text style={styles.name}>{profile?.full_name || 'Your Name'}</Text>
                    <Text style={styles.contactInfo}>
                        {profile?.location || ''} {profile?.email ? `| ${profile.email}` : ''}
                    </Text>
                </View>

                {/* Professional Summary */}
                {cvData?.professional_summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={styles.summaryText}>{cvData.professional_summary}</Text>
                    </View>
                )}

                {/* Work Experience */}
                {cvData?.work_experience && cvData.work_experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Work Experience</Text>
                        {cvData.work_experience.map((exp, index) => (
                            <View key={index} style={styles.expItem}>
                                <Text style={styles.jobTitle}>{exp.title}</Text>
                                <Text style={styles.company}>{exp.company}</Text>
                                <Text style={styles.duration}>{exp.duration}</Text>
                                {exp.bullets?.map((bullet, i) => (
                                    <Text key={i} style={styles.bullet}>• {bullet}</Text>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Education */}
                {cvData?.education && cvData.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {cvData.education.map((edu, index) => (
                            <View key={index} style={styles.eduItem}>
                                <Text style={styles.jobTitle}>{edu.degree}</Text>
                                <Text style={styles.company}>{edu.school}</Text>
                                <Text style={styles.duration}>{edu.year}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills */}
                {cvData?.skills && cvData.skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        <View style={styles.skillsContainer}>
                            <Text>{cvData.skills.join(' • ')}</Text>
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
}

export default CVDocument;