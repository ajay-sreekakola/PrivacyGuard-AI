/**
 * PrivacyGuard - Compliance Report Generator
 * Generates structured compliance reports for HIPAA, GDPR, PCI-DSS, etc.
 */

const FRAMEWORK_DETAILS = {
  HIPAA: {
    name: 'Health Insurance Portability and Accountability Act',
    categories: ['PHI', 'MEDICAL', 'PII'],
    requirements: [
      { id: '164.312(a)(2)(iv)', title: 'Encryption and Decryption', description: 'Implement a mechanism to encrypt and decrypt electronic PHI' },
      { id: '164.312(b)', title: 'Audit Controls', description: 'Implement hardware, software, and/or procedural mechanisms to record and examine activity' },
      { id: '164.514(b)', title: 'De-identification', description: 'PHI must be de-identified before use in AI systems' },
      { id: '164.308(a)(1)', title: 'Risk Analysis', description: 'Conduct an accurate and thorough assessment of potential risks' }
    ],
    penaltyRange: '$100 - $50,000 per violation, up to $1.9M/year'
  },
  'GDPR': {
    name: 'General Data Protection Regulation',
    categories: ['PII', 'BEHAVIORAL', 'BIOMETRIC'],
    requirements: [
      { id: 'Art. 5', title: 'Principles of Processing', description: 'Personal data shall be processed lawfully, fairly and transparently' },
      { id: 'Art. 25', title: 'Data Protection by Design', description: 'Implement data protection principles from the design stage' },
      { id: 'Art. 32', title: 'Security of Processing', description: 'Implement appropriate technical measures to ensure data security' },
      { id: 'Art. 35', title: 'Data Protection Impact Assessment', description: 'DPIA required for high-risk AI processing' }
    ],
    penaltyRange: 'Up to €20M or 4% of global annual turnover'
  },
  'PCI-DSS': {
    name: 'Payment Card Industry Data Security Standard',
    categories: ['FINANCIAL', 'CREDENTIAL'],
    requirements: [
      { id: 'Req. 3', title: 'Protect Stored Account Data', description: 'Do not store sensitive authentication data after authorization' },
      { id: 'Req. 4', title: 'Encrypt Transmission', description: 'Encrypt transmission of cardholder data over open networks' },
      { id: 'Req. 6', title: 'Secure Systems', description: 'Develop and maintain secure systems and software' },
      { id: 'Req. 10', title: 'Log and Monitor', description: 'Log and monitor all access to network resources and cardholder data' }
    ],
    penaltyRange: '$5,000 - $100,000 per month'
  },
  ITAR: {
    name: 'International Traffic in Arms Regulations',
    categories: ['DEFENSE', 'TECHNICAL'],
    requirements: [
      { id: '22 CFR 120-130', title: 'Export Controls', description: 'Defense articles and services must not be disclosed to foreign persons' },
      { id: '22 CFR 122', title: 'Registration', description: 'All manufacturers must register with DDTC' }
    ],
    penaltyRange: 'Up to $1M per violation and 20 years imprisonment'
  },
  SOC2: {
    name: 'Service Organization Control 2',
    categories: ['CREDENTIAL', 'OPERATIONAL'],
    requirements: [
      { id: 'CC6', title: 'Logical and Physical Access Controls', description: 'Implement controls to prevent unauthorized access' },
      { id: 'CC7', title: 'System Operations', description: 'Monitor system performance and detect security events' }
    ],
    penaltyRange: 'Loss of certification and business trust'
  }
};

function generateComplianceReport(scanResults, userInfo) {
  const { detections = [], riskScore = 0, riskLevel = 'low', complianceFlags = [], sector, createdAt } = scanResults;

  // Determine applicable frameworks
  const applicableFrameworks = complianceFlags.length > 0 ? complianceFlags : ['GDPR'];

  // Count violations by category
  const categoryCount = detections.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});

  // Assess compliance status per framework
  const frameworkAssessments = applicableFrameworks.map(fw => {
    const details = FRAMEWORK_DETAILS[fw];
    if (!details) return { framework: fw, status: 'unknown' };

    const relevantDetections = detections.filter(d =>
      details.categories.some(cat => d.category?.includes(cat) || cat.includes(d.category))
    );

    const criticalCount = relevantDetections.filter(d => d.riskLevel === 'critical').length;
    const highCount = relevantDetections.filter(d => d.riskLevel === 'high').length;

    let status, statusColor;
    if (criticalCount > 0) { status = 'NON_COMPLIANT'; statusColor = 'red'; }
    else if (highCount > 0) { status = 'AT_RISK'; statusColor = 'orange'; }
    else if (relevantDetections.length > 0) { status = 'REVIEW_NEEDED'; statusColor = 'yellow'; }
    else { status = 'COMPLIANT'; statusColor = 'green'; }

    return {
      framework: fw,
      name: details.name,
      status,
      statusColor,
      relevantDetections: relevantDetections.length,
      criticalIssues: criticalCount,
      requirements: details.requirements,
      penaltyRange: details.penaltyRange
    };
  });

  // Generate recommendations
  const recommendations = [];
  if (detections.some(d => d.category === 'PII')) {
    recommendations.push({ priority: 'HIGH', action: 'Implement PII masking before sending data to LLMs', framework: 'GDPR/CCPA' });
  }
  if (detections.some(d => d.category === 'MEDICAL')) {
    recommendations.push({ priority: 'CRITICAL', action: 'Enable HIPAA Safe Harbor de-identification (remove 18 PHI identifiers)', framework: 'HIPAA' });
  }
  if (detections.some(d => d.category === 'FINANCIAL')) {
    recommendations.push({ priority: 'CRITICAL', action: 'Apply PCI-DSS tokenization for all payment card data', framework: 'PCI-DSS' });
  }
  if (detections.some(d => d.category === 'CREDENTIAL')) {
    recommendations.push({ priority: 'CRITICAL', action: 'Rotate all exposed credentials immediately and audit access logs', framework: 'SOC2/ISO27001' });
  }
  if (riskScore > 60) {
    recommendations.push({ priority: 'HIGH', action: 'Conduct a formal Data Protection Impact Assessment (DPIA)', framework: 'GDPR Art. 35' });
  }

  return {
    reportId: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    scanDate: createdAt || new Date().toISOString(),
    organization: userInfo?.organization || 'Unknown',
    sector: sector || 'general',
    executive_summary: {
      overallRiskScore: riskScore,
      overallRiskLevel: riskLevel,
      totalDetections: detections.length,
      criticalFindings: detections.filter(d => d.riskLevel === 'critical').length,
      frameworksAssessed: applicableFrameworks.length,
      nonCompliantFrameworks: frameworkAssessments.filter(f => f.status === 'NON_COMPLIANT').length
    },
    detectionBreakdown: categoryCount,
    frameworkAssessments,
    recommendations,
    privacyScore: Math.max(0, 100 - riskScore),
    nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

function formatReportAsText(report) {
  const lines = [
    '═══════════════════════════════════════════════════════',
    '         PRIVACYGUARD AI - COMPLIANCE REPORT           ',
    '═══════════════════════════════════════════════════════',
    `Report ID: ${report.reportId}`,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    `Organization: ${report.organization}`,
    `Sector: ${report.sector.toUpperCase()}`,
    '',
    '─── EXECUTIVE SUMMARY ──────────────────────────────────',
    `Overall Risk Score: ${report.executive_summary.overallRiskScore}/100 (${report.executive_summary.overallRiskLevel.toUpperCase()})`,
    `Total Sensitive Detections: ${report.executive_summary.totalDetections}`,
    `Critical Findings: ${report.executive_summary.criticalFindings}`,
    `Non-Compliant Frameworks: ${report.executive_summary.nonCompliantFrameworks}/${report.executive_summary.frameworksAssessed}`,
    '',
    '─── COMPLIANCE STATUS ───────────────────────────────────',
    ...report.frameworkAssessments.map(f =>
      `${f.framework}: ${f.status} (${f.relevantDetections} detections, ${f.criticalIssues} critical)`
    ),
    '',
    '─── RECOMMENDATIONS ─────────────────────────────────────',
    ...report.recommendations.map((r, i) =>
      `${i + 1}. [${r.priority}] ${r.action}\n   Framework: ${r.framework}`
    ),
    '',
    '─── DETECTION BREAKDOWN ─────────────────────────────────',
    ...Object.entries(report.detectionBreakdown).map(([cat, count]) => `${cat}: ${count}`),
    '',
    `Privacy Score: ${report.privacyScore}/100`,
    `Next Review Due: ${new Date(report.nextReviewDate).toLocaleDateString()}`,
    '═══════════════════════════════════════════════════════'
  ];
  return lines.join('\n');
}

module.exports = { generateComplianceReport, formatReportAsText, FRAMEWORK_DETAILS };
