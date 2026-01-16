"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, FileText, Mail, Copy, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal for generating and displaying CV and Cover Letter
 */
export default function GenerationModal({
    isOpen,
    onClose,
    type, // 'cv' or 'letter'
    data, // { company, role, department, phrase, pitch }
    userId
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cvData, setCvData] = useState(null);
    const [letterData, setLetterData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState(type);

    useEffect(() => {
        if (isOpen && data) {
            generateContent();
        }
    }, [isOpen, data]);

    useEffect(() => {
        setActiveTab(type);
    }, [type]);

    const generateContent = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/stationf/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    company_name: data.company,
                    role_title: data.role,
                    department: data.department,
                    sector: data.sector || null,
                    company_description: data.pitch || null,
                    phrase: data.phrase || null
                })
            });

            const result = await res.json();

            if (result.success) {
                // Parse JSON responses
                try {
                    setCvData(typeof result.cv === 'string' ? JSON.parse(result.cv) : result.cv);
                } catch {
                    setCvData({ professional_summary: result.cv });
                }

                try {
                    setLetterData(typeof result.cover_letter === 'string' ? JSON.parse(result.cover_letter) : result.cover_letter);
                } catch {
                    setLetterData({ cover_letter: result.cover_letter });
                }
            } else {
                setError(result.error || 'Erreur de génération');
            }
        } catch (err) {
            console.error('Generation error:', err);
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatLetterForDisplay = (letterContent) => {
        if (!letterContent) return '';
        return letterContent.replace(/\\n/g, '\n');
    };

    const handleDownloadPDF = () => {
        const content = activeTab === 'cv' ? cvData : letterData;
        if (!content) return;

        // Create printable HTML content
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${activeTab === 'cv' ? 'CV' : 'Lettre de Motivation'} - ${data?.company}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #1a1a1a; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { font-size: 22px; margin-bottom: 8px; color: #111; }
        h2 { font-size: 14px; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        p { margin-bottom: 12px; font-size: 11pt; }
        .header { margin-bottom: 24px; }
        .subtitle { color: #666; font-size: 12px; margin-bottom: 4px; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .skill { background: #f3f4f6; padding: 4px 12px; border-radius: 4px; font-size: 11px; }
        .exp-item { margin-bottom: 16px; padding-left: 12px; border-left: 2px solid #e5e7eb; }
        .exp-title { font-weight: 600; font-size: 12pt; }
        .exp-meta { color: #666; font-size: 10pt; margin-bottom: 4px; }
        .bullet { margin-left: 16px; font-size: 10pt; color: #374151; }
        .letter-content { white-space: pre-wrap; font-size: 11pt; line-height: 1.8; }
        .subject { background: #f3f4f6; padding: 12px; margin-bottom: 20px; border-radius: 4px; }
        .subject-label { font-size: 10px; color: #666; }
        .subject-text { font-weight: 600; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>`;

        if (activeTab === 'cv' && cvData) {
            htmlContent += `
    <div class="header">
        <h1>${data?.role || 'CV'}</h1>
        <p class="subtitle">${data?.company} • Candidature spontanée</p>
    </div>`;

            if (cvData.professional_summary) {
                htmlContent += `
    <h2>Résumé Professionnel</h2>
    <p>${cvData.professional_summary}</p>`;
            }

            if (cvData.key_skills && cvData.key_skills.length > 0) {
                htmlContent += `
    <h2>Compétences</h2>
    <div class="skills">
        ${cvData.key_skills.map(s => `<span class="skill">${s}</span>`).join('')}
    </div>`;
            }

            if (cvData.experience && cvData.experience.length > 0) {
                htmlContent += `<h2>Expériences</h2>`;
                cvData.experience.forEach(exp => {
                    htmlContent += `
    <div class="exp-item">
        <p class="exp-title">${exp.title}</p>
        <p class="exp-meta">${exp.company} • ${exp.duration}</p>
        ${exp.bullets ? exp.bullets.map(b => `<p class="bullet">• ${b}</p>`).join('') : ''}
    </div>`;
                });
            }

            if (cvData.education && cvData.education.length > 0) {
                htmlContent += `<h2>Formation</h2>`;
                cvData.education.forEach(edu => {
                    htmlContent += `
    <div class="exp-item">
        <p class="exp-title">${edu.degree}</p>
        <p class="exp-meta">${edu.school} • ${edu.year}</p>
    </div>`;
                });
            }
        } else if (activeTab === 'letter' && letterData) {
            if (letterData.subject) {
                htmlContent += `
    <div class="subject">
        <p class="subject-label">Objet:</p>
        <p class="subject-text">${letterData.subject}</p>
    </div>`;
            }
            htmlContent += `
    <div class="letter-content">${formatLetterForDisplay(letterData.cover_letter)}</div>`;
        }

        htmlContent += `
</body>
</html>`;

        // Open in new window and trigger print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl max-h-[85vh] bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {activeTab === 'cv' ? '📄 CV Généré' : '✉️ Lettre de Motivation'}
                            </h2>
                            <p className="text-xs text-white/50">
                                {data?.company} • {data?.role}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/50 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('cv')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'cv'
                                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />
                            CV
                        </button>
                        <button
                            onClick={() => setActiveTab('letter')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'letter'
                                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            <Mail className="w-4 h-4 inline mr-2" />
                            Lettre
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mb-4" />
                                <p className="text-white/60">Génération en cours...</p>
                                <p className="text-xs text-white/40 mt-1">Cela peut prendre 10-15 secondes</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-red-400 mb-4">{error}</p>
                                <button
                                    onClick={generateContent}
                                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm"
                                >
                                    Réessayer
                                </button>
                            </div>
                        ) : activeTab === 'cv' && cvData ? (
                            <div className="space-y-4">
                                {/* Professional Summary */}
                                {cvData.professional_summary && (
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2">
                                            Résumé Professionnel
                                        </h3>
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            {cvData.professional_summary}
                                        </p>
                                    </div>
                                )}

                                {/* Key Skills */}
                                {cvData.key_skills && cvData.key_skills.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2">
                                            Compétences Clés
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {cvData.key_skills.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-[var(--primary)]/20 text-[var(--primary)] text-xs rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Experience */}
                                {cvData.experience && cvData.experience.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-3">
                                            Expériences
                                        </h3>
                                        <div className="space-y-3">
                                            {cvData.experience.map((exp, i) => (
                                                <div key={i} className="border-l-2 border-white/20 pl-3">
                                                    <p className="text-sm font-medium text-white">{exp.title}</p>
                                                    <p className="text-xs text-white/50">{exp.company} • {exp.duration}</p>
                                                    {exp.bullets && (
                                                        <ul className="mt-1 space-y-1">
                                                            {exp.bullets.map((b, j) => (
                                                                <li key={j} className="text-xs text-white/60">• {b}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {cvData.education && cvData.education.length > 0 && (
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-3">
                                            Formation
                                        </h3>
                                        <div className="space-y-2">
                                            {cvData.education.map((edu, i) => (
                                                <div key={i}>
                                                    <p className="text-sm font-medium text-white">{edu.degree}</p>
                                                    <p className="text-xs text-white/50">{edu.school} • {edu.year}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'letter' && letterData ? (
                            <div className="space-y-4">
                                {/* Subject */}
                                {letterData.subject && (
                                    <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg">
                                        <p className="text-xs text-white/50 mb-1">Objet:</p>
                                        <p className="text-sm text-white font-medium">{letterData.subject}</p>
                                    </div>
                                )}

                                {/* Letter Content */}
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                                        {formatLetterForDisplay(letterData.cover_letter)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-white/40">
                                Aucun contenu généré
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!loading && !error && (cvData || letterData) && (
                        <div className="p-4 border-t border-white/10 flex gap-3">
                            <button
                                onClick={() => handleCopy(
                                    activeTab === 'cv'
                                        ? JSON.stringify(cvData, null, 2)
                                        : formatLetterForDisplay(letterData?.cover_letter)
                                )}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm hover:bg-white/10"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copié!' : 'Copier'}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-xl text-white font-medium text-sm hover:opacity-90"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger PDF
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
