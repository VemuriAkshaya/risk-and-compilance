import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Supplier, RiskLevel } from '../types/supplier';
import { useToast } from '../context/ToastContext';
import { SapCard } from '../components/common/Card';
import { RiskBadge } from '../components/common/Badge';
import { calculateRiskLevel } from '../services/storageService';
import {
  Building2,
  Save,
  ArrowLeft,
  Globe,
  MapPin,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  User,
} from 'lucide-react';

export const SupplierFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [category, setCategory] = useState('Industrial Machinery & Automation');
  const [website, setWebsite] = useState('');

  // Location & Contact
  const [country, setCountry] = useState('Germany');
  const [countryCode, setCountryCode] = useState('DE');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Risk baseline
  const [financialScore, setFinancialScore] = useState(25);
  const [operationalScore, setOperationalScore] = useState(30);
  const [geopoliticalScore, setGeopoliticalScore] = useState(30);
  const [esgScore, setEsgScore] = useState(25);
  const [cyberScore, setCyberScore] = useState(25);
  const [mitigationNotes, setMitigationNotes] = useState('');

  // Purchase & Financials
  const [annualSpend, setAnnualSpend] = useState<number>(500000);
  const [spendCurrency, setSpendCurrency] = useState('EUR');
  const [paymentTerms, setPaymentTerms] = useState('Net 60 Days');
  const [bankIban, setBankIban] = useState('');

  // Computed Risk Score
  const computedScore = Math.round(
    financialScore * 0.25 +
      operationalScore * 0.25 +
      geopoliticalScore * 0.2 +
      esgScore * 0.15 +
      cyberScore * 0.15
  );
  const computedLevel: RiskLevel = calculateRiskLevel(computedScore);

  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      supplierService
        .getSupplierById(id)
        .then((s) => {
          if (!s) {
            error('Supplier Not Found', `No record exists for ${id}`);
            navigate('/suppliers');
            return;
          }

          setName(s.name);
          setTaxId(s.taxId);
          setCategory(s.category);
          setWebsite(s.website);

          setCountry(s.country);
          setCountryCode(s.countryCode);
          setCity(s.city);
          setAddress(s.address);
          setContactPerson(s.contactPerson);
          setContactEmail(s.contactEmail);
          setContactPhone(s.contactPhone);

          if (s.riskAssessment) {
            setFinancialScore(s.riskAssessment.financialScore);
            setOperationalScore(s.riskAssessment.operationalScore);
            setGeopoliticalScore(s.riskAssessment.geopoliticalScore);
            setEsgScore(s.riskAssessment.esgScore);
            setCyberScore(s.riskAssessment.cyberScore);
            setMitigationNotes(s.riskAssessment.mitigationNotes || '');
          }

          setAnnualSpend(s.annualSpend);
          setSpendCurrency(s.spendCurrency);
          setPaymentTerms(s.paymentTerms);
          setBankIban(s.bankIban);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode, navigate]);

  const handleCountryChange = (c: string) => {
    setCountry(c);
    const codeMap: Record<string, string> = {
      Germany: 'DE',
      'United States': 'US',
      Japan: 'JP',
      'South Korea': 'KR',
      India: 'IN',
      France: 'FR',
      Switzerland: 'CH',
      Taiwan: 'TW',
      Sweden: 'SE',
      Singapore: 'SG',
    };
    setCountryCode(codeMap[c] || 'XX');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Validation Error', 'Supplier legal company name is required.');
      return;
    }
    if (!taxId.trim()) {
      error('Validation Error', 'Tax Identification / VAT Registration is required.');
      return;
    }
    if (!contactEmail.trim()) {
      error('Validation Error', 'Contact email is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Supplier> = {
        name: name.trim(),
        taxId: taxId.trim(),
        category,
        website: website.trim(),
        country,
        countryCode,
        city: city.trim(),
        address: address.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        riskScore: computedScore,
        riskLevel: computedLevel,
        riskAssessment: {
          financialScore,
          operationalScore,
          geopoliticalScore,
          esgScore,
          cyberScore,
          overallScore: computedScore,
          level: computedLevel,
          lastAssessedDate: new Date().toISOString().slice(0, 10),
          assessedBy: 'Lead Compliance Officer (admin)',
          mitigationNotes,
        },
        annualSpend,
        spendCurrency,
        paymentTerms,
        bankIban: bankIban.trim(),
      };

      if (isEditMode && id) {
        const updated = await supplierService.updateSupplier(id, payload);
        success('Supplier Updated', `Master data for ${updated.name} (${updated.id}) has been updated.`);
        navigate(`/suppliers/${updated.id}`);
      } else {
        const created = await supplierService.createSupplier(payload);
        success('Supplier Onboarded', `New supplier ${created.name} (${created.id}) registered into SAP catalog.`);
        navigate(`/suppliers/${created.id}`);
      }
    } catch (err: any) {
      error('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    'Industrial Machinery & Automation',
    'Electronic Components & Ceramics',
    'Heavy Engineering & Defense Materials',
    'Logistics & Intermodal Freight',
    'Contract Electronics & PCB Assembly',
    'IT Consulting & Enterprise Cloud',
    'Electrical Switchgear & Energy Management',
    'Specialty Chemicals & Solvents',
    'Semiconductors & Ultra-low Power Wireless',
    'Automotive Sensors & Braking Systems',
    'Raw Materials & Metallurgy',
  ];

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading supplier details...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/suppliers" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
              <ArrowLeft size={16} />
              <span>Back to Suppliers Directory</span>
            </Link>
          </div>
          <h1>
            <Building2 size={26} color="#0070f2" />
            <span>{isEditMode ? `Edit Master Data: ${name || id}` : 'Onboard New Enterprise Supplier'}</span>
          </h1>
          <p>
            {isEditMode
              ? `Manage legal identity, risk baseline parameters, and payment terms for ${id}.`
              : 'Register a new vendor into SAP Ariba Risk & S/4HANA Cloud procurement master.'}
          </p>
        </div>

        <div className="page-actions">
          <Link to={isEditMode ? `/suppliers/${id}` : '/suppliers'} className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save size={16} />
            <span>{isSaving ? 'Submitting to SAP...' : isEditMode ? 'Update Supplier' : 'Register Supplier'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: General Company Information */}
        <SapCard
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#0070f2" />
              <span>1. Corporate Identity &amp; Classification</span>
            </div>
          }
          subtitle="Legal entity registered name, commercial category, and tax identification"
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Company Legal Entity Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Siemens Industrial Automation AG"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Procurement Category <span className="req">*</span>
              </label>
              <select
                className="sap-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Tax Identification / VAT Number <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DE-811124567 or US-841920841"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Website</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Globe size={15} />
                </span>
                <input
                  type="url"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>
        </SapCard>

        {/* Section 2: Headquarters & Primary Contact */}
        <SapCard
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#0070f2" />
              <span>2. Headquarters Location &amp; Primary Representative</span>
            </div>
          }
          subtitle="Operating address, jurisdiction, and authorized procurement point of contact"
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Country of Incorporation <span className="req">*</span>
              </label>
              <select
                className="sap-select"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <option value="Germany">Germany (DE)</option>
                <option value="United States">United States (US)</option>
                <option value="Japan">Japan (JP)</option>
                <option value="South Korea">South Korea (KR)</option>
                <option value="India">India (IN)</option>
                <option value="France">France (FR)</option>
                <option value="Switzerland">Switzerland (CH)</option>
                <option value="Taiwan">Taiwan (TW)</option>
                <option value="Sweden">Sweden (SE)</option>
                <option value="Singapore">Singapore (SG)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">City / State</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Munich, Bavaria"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Street Address &amp; Postal Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Werner-von-Siemens-Straße 1, 80333 Munich"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Person Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <User size={15} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="e.g. Dr. Hans-Peter Weber"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Official Contact Email <span className="req">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="compliance@supplier.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Phone size={15} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="+49 89 636 00"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </SapCard>

        {/* Section 3: Baseline Risk Parameters */}
        <SapCard
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#0070f2" />
              <span>3. Baseline Risk Assessment Dimensions</span>
            </div>
          }
          subtitle="Establish onboarding risk baseline weights (0-30 Low, 31-60 Medium, 61-100 High)"
        >
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Initial Composite Risk Rating
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{computedScore}</span>
                <span style={{ color: '#64748b' }}>/ 100</span>
                <RiskBadge level={computedLevel} />
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '320px', textAlign: 'right' }}>
              Weighted formula: Financial (25%) + Operational (25%) + Geopolitical (20%) + ESG (15%) + Cyber (15%)
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Financial Risk (0–100): {financialScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={financialScore}
                onChange={(e) => setFinancialScore(Number(e.target.value))}
                style={{ accentColor: '#0070f2' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operational Risk (0–100): {operationalScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={operationalScore}
                onChange={(e) => setOperationalScore(Number(e.target.value))}
                style={{ accentColor: '#0070f2' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Geopolitical Risk (0–100): {geopoliticalScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={geopoliticalScore}
                onChange={(e) => setGeopoliticalScore(Number(e.target.value))}
                style={{ accentColor: '#0070f2' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ESG &amp; Sustainability Risk (0–100): {esgScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={esgScore}
                onChange={(e) => setEsgScore(Number(e.target.value))}
                style={{ accentColor: '#0070f2' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cyber Security Risk (0–100): {cyberScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={cyberScore}
                onChange={(e) => setCyberScore(Number(e.target.value))}
                style={{ accentColor: '#0070f2' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Due Diligence Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Verified Dun & Bradstreet credit rating."
                value={mitigationNotes}
                onChange={(e) => setMitigationNotes(e.target.value)}
              />
            </div>
          </div>
        </SapCard>

        {/* Section 4: Purchase Information & Bank Terms */}
        <SapCard
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#0070f2" />
              <span>4. Purchasing, Payment Terms &amp; Banking</span>
            </div>
          }
          subtitle="Expected annual spend volume, currency billing, and payment term terms"
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Target Annual Spend Volume</label>
              <input
                type="number"
                className="form-input"
                value={annualSpend}
                onChange={(e) => setAnnualSpend(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Billing Currency</label>
              <select
                className="sap-select"
                value={spendCurrency}
                onChange={(e) => setSpendCurrency(e.target.value)}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                className="sap-select"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
                <option value="Net 90 Days">Net 90 Days</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bank Account IBAN / Swift</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DE89370400440532013000"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
              />
            </div>
          </div>
        </SapCard>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link to={isEditMode ? `/suppliers/${id}` : '/suppliers'} className="btn btn-secondary btn-lg">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSaving}
          >
            <Save size={18} />
            <span>{isSaving ? 'Submitting...' : isEditMode ? 'Update Supplier Profile' : 'Complete Registration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
