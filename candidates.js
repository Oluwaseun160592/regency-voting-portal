/**
 * Regency Assets Management Limited - Voting Categories & Nominees Data
 * Official Corporate Excellence & Leadership Awards
 * Configured with 15 Official Award Categories and 13 Staff Nominees
 */

const NOMINEES_ROSTER = [
  {
    id: "nominee-ogidi-omolola",
    name: "Ogidi A. Omolola, ACS",
    role: "Deputy Managing Director",
    department: "Executive Management",
    initials: "OA",
    badgeColor: "gold",
    tagline: "Exemplary executive steering, corporate strategic leadership, and stakeholder value delivery.",
    tenure: "Executive Board",
    bio: "Ogidi A. Omolola, ACS serves as the Deputy Managing Director of Regency Assets Management Limited. Providing strategic direction, high-level corporate governance, and day-to-day organizational momentum across all business units.",
    achievements: [
      "Provides executive oversight across wealth management, securities dealing, and advisory portfolios.",
      "Champions enterprise excellence and adherence to SEC, NGX, and NASD operational codes.",
      "Drives strategic institutional growth and corporate positioning in the capital market."
    ]
  },
  {
    id: "nominee-muritala-olaniyi",
    name: "Muritala Bunmi Olaniyi, ACA",
    role: "CFO / ADMIN",
    department: "Finance & Administration",
    initials: "MO",
    badgeColor: "blue",
    tagline: "Prudent fiscal governance, financial stewardship, administrative efficiency, and capital adequacy.",
    tenure: "Senior Management",
    bio: "Muritala Bunmi Olaniyi, ACA leads the Finance and Administration division of Regency Assets Management Limited. He oversees institutional budgeting, financial controls, statutory reporting, and seamless administrative operations.",
    achievements: [
      "Maintains impeccable capital adequacy ratios well above SEC regulatory thresholds.",
      "Ensures flawless annual financial auditing and prompt regulatory submissions.",
      "Streamlines administrative and cost management processes across the firm."
    ]
  },
  {
    id: "nominee-nelson-osarumwense",
    name: "Nelson Osarumwense",
    role: "Chief Compliance Officer",
    department: "Compliance & Regulatory Affairs",
    initials: "NO",
    badgeColor: "emerald",
    tagline: "Uncompromising compliance oversight, regulatory relations, and ethical integrity.",
    tenure: "Senior Management",
    bio: "Nelson Osarumwense is the Chief Compliance Officer at Regency Assets Management Limited, dedicated to safeguarding the firm's licensing status, ethical practices, Anti-Money Laundering (AML) standards, and full alignment with market regulators.",
    achievements: [
      "Leads comprehensive compliance programs with SEC, NGX, NASD, and CSCS.",
      "Enforces robust AML/CFT monitoring frameworks and corporate governance checks.",
      "Maintains an exemplary zero-penalty regulatory compliance track record."
    ]
  },
  {
    id: "nominee-sesan-olokoyo",
    name: "Sesan Olokoyo",
    role: "Head, Enterprise Risk and Management",
    department: "Enterprise Risk Management",
    initials: "SO",
    badgeColor: "purple",
    tagline: "Vigilant risk management, market volatility safeguards, and internal controls.",
    tenure: "Senior Management",
    bio: "Sesan Olokoyo heads the Enterprise Risk and Management department. He formulates risk assessment policies, stress tests trading portfolios, and embeds proactive risk mitigation mechanisms across operations.",
    achievements: [
      "Architected Regency's enterprise risk dashboard for real-time market risk surveillance.",
      "Supervised enterprise-wide operational risk audits and risk-adjusted capital assessments.",
      "Championed institutional business continuity planning and risk awareness training."
    ]
  },
  {
    id: "nominee-gbolahan-onasanya",
    name: "Gbolahan Onasanya",
    role: "Business Development Manager",
    department: "Business Development",
    initials: "GO",
    badgeColor: "gold",
    tagline: "Dynamic market expansion, institutional client onboarding, and relationship development.",
    tenure: "Management",
    bio: "Gbolahan Onasanya serves as Business Development Manager, driving client acquisition, institutional partnerships, and promoting Regency's wealth and asset management products across retail and corporate sectors.",
    achievements: [
      "Spearheads new market penetration initiatives for Regency's investment solutions.",
      "Cultivates valuable relationships with institutional clients and high-net-worth investors.",
      "Coordinates marketing strategies to expand RAML's capital market presence."
    ]
  },
  {
    id: "nominee-celestine-arowosola",
    name: "Celestine Arowosola",
    role: "Registrar",
    department: "Registry & Shareholder Services",
    initials: "CA",
    badgeColor: "emerald",
    tagline: "Meticulous shareholder registry maintenance, entitlement processing, and corporate records.",
    tenure: "Professional Staff",
    bio: "Celestine Arowosola manages Registry operations, ensuring accurate shareholder records, dividend verification, allotment administration, and prompt investor reconciliation.",
    achievements: [
      "Maintains high integrity across all registrar files and shareholder registers.",
      "Resolves shareholder queries, address changes, and dividend reconciliations efficiently.",
      "Collaborates closely with regulatory bodies on accurate register maintenance."
    ]
  },
  {
    id: "nominee-oluwaseun-fatokun",
    name: "Oluwaseun Fatokun",
    role: "Head, IT",
    department: "Information Technology",
    initials: "OF",
    badgeColor: "purple",
    tagline: "Robust system architecture, cyber defense, digital platform uptime, and fintech infrastructure.",
    tenure: "Senior Staff",
    bio: "Oluwaseun Fatokun heads the IT department, managing network infrastructure, trading workstations, database integrity, and online client portal operations across Regency Assets Management Limited.",
    achievements: [
      "Guarantees seamless connectivity between RAML dealing terminals, NGX, and NASD portals.",
      "Implements stringent cybersecurity protocols, data backups, and disaster recovery readiness.",
      "Drives digital modernization and automation of internal operational workflows."
    ]
  },
  {
    id: "nominee-kayode-ibuowo",
    name: "Kayode Ibuowo",
    role: "Compliance Officer",
    department: "Compliance & Regulatory Affairs",
    initials: "KI",
    badgeColor: "blue",
    tagline: "Vigilant regulatory monitoring, AML/KYC screening, and ethical standards enforcement.",
    tenure: "Professional Staff",
    bio: "Kayode Ibuowo serves as Compliance Officer, actively enforcing KYC/AML compliance, statutory filings, employee conduct codes, and ensuring that all transactions comply strictly with SEC and NGX guidelines.",
    achievements: [
      "Executes rigorous customer onboarding checks and institutional KYC validations.",
      "Assists in regulatory reporting, inspections, and monitoring capital market guidelines.",
      "Promotes a culture of institutional integrity and transparency across all operational desks."
    ]
  },
  {
    id: "nominee-faith-iyaji",
    name: "Faith Iyaji",
    role: "Accountant",
    department: "Finance & Accounts",
    initials: "FI",
    badgeColor: "gold",
    tagline: "Precise ledger maintenance, timely reconciliation, and meticulous financial records.",
    tenure: "Professional Staff",
    bio: "Faith Iyaji manages accounting duties within the Finance & Accounts department, ensuring accurate general ledger entries, daily bank reconciliations, client fund accounting, and disbursement controls.",
    achievements: [
      "Performs daily multi-bank reconciliations supporting securities settlement accounts.",
      "Prepares accurate financial schedules and supporting documentation for internal audits.",
      "Ensures prompt payment processing and disciplined financial accounting."
    ]
  },
  {
    id: "nominee-jumoke-adebodun",
    name: "Jumoke Adebodun",
    role: "Operation Officer",
    department: "Operations & Settlement",
    initials: "JA",
    badgeColor: "emerald",
    tagline: "Accurate trade execution processing, CSCS clearing, and timely settlement reconciliation.",
    tenure: "Professional Staff",
    bio: "Jumoke Adebodun serves as Operation Officer, focusing on day-to-day trade processing, CSCS depository verification, and seamless transaction settlement for client accounts.",
    achievements: [
      "Coordinates daily trade capture, matching, and settlement with the Central Securities Clearing System.",
      "Maintains low exception rates and ensures accurate investor account crediting.",
      "Supports dealing desks with rapid trade execution verification."
    ]
  },
  {
    id: "nominee-bolaji-olusi",
    name: "Bolaji Olusi",
    role: "Customer Service Officer",
    department: "Customer Service & Client Experience",
    initials: "BO",
    badgeColor: "gold",
    tagline: "Courteous client engagement, prompt enquiry resolution, and outstanding investor relations.",
    tenure: "Professional Staff",
    bio: "Bolaji Olusi is the frontline Customer Service Officer at Regency Assets Management Limited, delivering warm, professional, and efficient support for client enquiries, portfolio statements, and onboarding.",
    achievements: [
      "Provides five-star frontline support across telephone, email, and in-person client visits.",
      "Ensures rapid follow-up and resolution of client requests and account documentation needs.",
      "Champions positive customer experiences and strengthens investor loyalty to Regency."
    ]
  },
  {
    id: "nominee-esther-ambali",
    name: "Esther Ambali",
    role: "Operation Officer",
    department: "Operations & Settlement",
    initials: "EA",
    badgeColor: "emerald",
    tagline: "Operational diligence, securities processing, and dependable daily clearing support.",
    tenure: "Professional Staff",
    bio: "Esther Ambali is an Operation Officer committed to transaction processing, documentation integrity, and maintaining efficient turnaround in securities custody and transfer operations.",
    achievements: [
      "Handles investor mandate processing, transfer requests, and verification with speed and precision.",
      "Collaborates with banking partners and regulatory clearing channels for flawless trade backing.",
      "Contributes to operational efficiency and high customer trust."
    ]
  },
  {
    id: "nominee-taiwo-layonu",
    name: "Taiwo Layonu",
    role: "Research",
    department: "Research & Market Intelligence",
    initials: "TL",
    badgeColor: "blue",
    tagline: "Actionable equity analysis, macroeconomic surveillance, and investment recommendations.",
    tenure: "Professional Staff",
    bio: "Taiwo Layonu leads research and market analysis, providing high-conviction equity analysis, macroeconomic commentary, and valuation insights that guide trading desks and client portfolios.",
    achievements: [
      "Publishes timely market reports, NGX daily summaries, and economic reviews.",
      "Conducts fundamental company valuations to support investment advisory mandates.",
      "Delivers data-driven market intelligence for informed wealth management decisions."
    ]
  }
];

// Helper to create category definition with roster
function createCategory(id, num, name, description, icon) {
  return {
    id,
    number: num,
    name,
    shortName: name,
    icon,
    description,
    criteria: description,
    nominees: NOMINEES_ROSTER
  };
}

const CATEGORIES_DATA = [
  createCategory("staff-of-the-year", 1, "Staff of the Year", "The employee with the best overall contribution to the company.", "fa-solid fa-trophy"),
  createCategory("best-performing-staff", 2, "Best Performing Staff", "Outstanding achievement of assigned responsibilities and targets.", "fa-solid fa-chart-line"),
  createCategory("most-diligent-staff", 3, "Most Diligent Staff", "Consistency, hard work, and attention to detail.", "fa-solid fa-clipboard-check"),
  createCategory("most-punctual-staff", 4, "Most Punctual Staff", "Excellent timekeeping and attendance.", "fa-solid fa-clock"),
  createCategory("most-innovative-staff", 5, "Most Innovative Staff", "Creative ideas and improvements to company processes.", "fa-solid fa-lightbulb"),
  createCategory("best-team-player", 6, "Best Team Player", "Collaboration and support for colleagues.", "fa-solid fa-people-group"),
  createCategory("most-dedicated-staff", 7, "Most Dedicated Staff", "Exceptional commitment to the company.", "fa-solid fa-heart"),
  createCategory("best-customer-service", 8, "Best Customer Service Staff", "Outstanding client service and relationship management.", "fa-solid fa-headset"),
  createCategory("most-reliable-staff", 9, "Most Reliable Staff", "Consistently dependable and responsible.", "fa-solid fa-shield-halved"),
  createCategory("most-improved-staff", 10, "Most Improved Staff", "Significant growth in skills and performance.", "fa-solid fa-arrow-trend-up"),
  createCategory("unsung-hero", 11, "Unsung Hero", "Valuable contributions that often go unnoticed.", "fa-solid fa-medal"),
  createCategory("best-work-ethics", 12, "Best Work Ethics", "Integrity, discipline, and professionalism.", "fa-solid fa-scale-balanced"),
  createCategory("best-departmental-performance", 13, "Best Departmental Performance", "Outstanding results within a department.", "fa-solid fa-building-columns"),
  createCategory("management-recognition", 14, "Management Recognition Award", "Exceptional contribution acknowledged by management.", "fa-solid fa-star"),
  createCategory("chairman-special-recognition", 15, "Chairman's Special Recognition Award", "A special honour for an employee whose contribution stands out.", "fa-solid fa-crown")
];

const VOTING_DATA = {
  electionTitle: "Regency Annual Corporate Excellence Awards",
  electionSubtitle: "Celebrating Distinction, Integrity & Leadership across Regency Assets Management Limited",
  organization: "Regency Assets Management Limited",
  regulatoryInfo: "Trading Licence Holder of NGX Ltd & Dealing Member of NASD | SEC Regulated",
  votingDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
  categories: CATEGORIES_DATA,
  nomineesRoster: NOMINEES_ROSTER,
  verifiedVoterRoster: [
    { id: "RAML-1001", name: "Executive Office - Board Representative", department: "Executive Board" },
    { id: "RAML-2045", name: "Corporate Finance Staff Voter", department: "Investment Banking" },
    { id: "RAML-3108", name: "Institutional Dealing Desk Member", department: "Securities Trading" },
    { id: "RAML-4092", name: "Private Wealth Advisory Voter", department: "Asset Management" },
    { id: "RAML-5520", name: "Audit & Risk Compliance Voter", department: "Internal Control" },
    { id: "RAML-8821", name: "General Staff & Associate Voter", department: "Operations & IT" }
  ]
};

// Export to window
if (typeof window !== "undefined") {
  window.VOTING_DATA = VOTING_DATA;
}
