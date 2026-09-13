import React, { useState, useEffect } from 'react';
import { X402Challenge, X402PaymentRecord } from '../../types';
import { ApiService } from '../../services/api';
import {
  Zap,
  CheckCircle2,
  Shield,
  ArrowRight,
  Wallet,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Lock,
  Unlock
} from 'lucide-react';

interface X402PaymentModalProps {
  onClose?: () => void;
}

export const X402PaymentModal: React.FC<X402PaymentModalProps> = () => {
  const [selectedService, setSelectedService] = useState<'PRIORITY_SCAN' | 'GEOTIFF_EXPORT' | 'HIGH_FREQ' | 'PDF_DOSSIER'>('PRIORITY_SCAN');
  const [challenge, setChallenge] = useState<X402Challenge | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>(() => localStorage.getItem('kshitiraksha_algo_wallet') || '');
  const [walletConnected, setWalletConnected] = useState<boolean>(() => !!localStorage.getItem('kshitiraksha_algo_wallet'));
  const [walletInput, setWalletInput] = useState<string>('');
  const [showWalletInput, setShowWalletInput] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string>('');
  const [walletType, setWalletType] = useState<string>('Pera / Defly Wallet (Algorand)');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [paymentRecords, setPaymentRecords] = useState<X402PaymentRecord[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      const recs = await ApiService.getX402Records();
      setPaymentRecords(recs);
    };
    fetchRecords();
  }, []);

  const services = [
    {
      id: 'PRIORITY_SCAN',
      title: 'Priority Sentinel-2 Compute Re-scan',
      price: 0.25,
      resource: '/api/v1/premium/priority-analysis',
      desc: 'Bypasses standard queue; executes immediate L2A cloud-masking & GPU-accelerated NDVI diffing within 12 seconds.'
    },
    {
      id: 'GEOTIFF_EXPORT',
      title: 'Multi-Spectral Raw GeoTIFF Bundle',
      price: 0.50,
      resource: '/api/v1/premium/geotiff-export',
      desc: 'Full 16-bit calibrated surface reflectance rasters (B2, B3, B4, B8) and cloud probability masks in EPSG:4326.'
    },
    {
      id: 'HIGH_FREQ',
      title: 'High-Frequency Orbital Watch (Weekly Pass)',
      price: 1.00,
      resource: '/api/v1/premium/orbital-watch',
      desc: 'Automated 5-day revisit monitoring trigger with SMS/Webhook dispatch on detection confidence > 85%.'
    },
    {
      id: 'PDF_DOSSIER',
      title: 'Certified Executive Intelligence Dossier',
      price: 0.15,
      resource: '/api/v1/premium/certified-dossier',
      desc: 'Tamper-proof verifiable PDF intelligence report with on-chain cryptographic audit signature hash.'
    }
  ];

  const currentService = services.find(s => s.id === selectedService)!;

  const handleConnectWallet = (addr: string) => {
    const clean = addr.trim();
    if (!clean) {
      setWalletError('Please enter an Algorand address.');
      return;
    }
    if (clean.length < 20) {
      setWalletError('Please enter a valid Algorand account address.');
      return;
    }
    setWalletAddress(clean);
    setWalletConnected(true);
    setWalletError('');
    localStorage.setItem('kshitiraksha_algo_wallet', clean);
    setShowWalletInput(false);
  };

  const handleDisconnectWallet = () => {
    setWalletAddress('');
    setWalletConnected(false);
    setWalletInput('');
    localStorage.removeItem('kshitiraksha_algo_wallet');
  };

  const handleRequestChallenge = async () => {
    setIsLoading(true);
    setPaymentSuccess(false);
    const chal = await ApiService.getX402Challenge(currentService.resource, currentService.price);
    setChallenge(chal);
    setIsLoading(false);
  };

  const handleSimulatePayment = async () => {
    if (!challenge) return;
    if (!walletConnected || !walletAddress) {
      setShowWalletInput(true);
      setWalletError('Please connect or provide your Algorand wallet address to sign.');
      return;
    }

    setIsPaying(true);

    // Simulate Algorand Testnet block commitment
    await new Promise(r => setTimeout(r, 1400));
    const testnetTxId = `ALGO-TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setTxHash(testnetTxId);

    const result = await ApiService.verifyX402Payment(
      challenge.challenge_token,
      testnetTxId,
      walletAddress,
      currentService.title,
      currentService.price
    );

    setIsPaying(false);
    if (result.success) {
      setPaymentSuccess(true);
      if (result.record) {
        setPaymentRecords(prev => [result.record!, ...prev]);
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, var(--amber-500), var(--copper-500), var(--emerald-500))'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--amber-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--amber-500)'
                }}
              >
                <Zap size={18} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                AlgoKit / x402 Micropayment Protocol
              </h1>
              <span className="badge badge-amber font-mono">Algorand Testnet Facilitator</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '850px' }}>
              Decentralized pay-per-request monetization for heavy satellite raster computations.
              Clients receive an HTTP 402 challenge, sign an ALGO micro-transaction, and immediately receive priority clearance.
            </p>
          </div>

          {/* Wallet State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {walletConnected && walletAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="badge badge-emerald font-mono" style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={14} />
                  <span>{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectWallet}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', fontSize: '11px' }}
                  title="Disconnect Wallet"
                >
                  Disconnect
                </button>
              </div>
            ) : showWalletInput ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Algorand 58-char address..."
                    value={walletInput}
                    onChange={e => setWalletInput(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      width: '240px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleConnectWallet(walletInput)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowWalletInput(false); setWalletError(''); }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                  >
                    Cancel
                  </button>
                </div>
                {walletError && (
                  <span style={{ fontSize: '10px', color: '#f87171' }}>{walletError}</span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowWalletInput(true)}
                className="btn btn-amber btn-sm"
                style={{ gap: '6px' }}
              >
                <Wallet size={14} />
                <span>Connect Algorand Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {services.map(s => (
          <div
            key={s.id}
            onClick={() => {
              setSelectedService(s.id as any);
              setChallenge(null);
              setPaymentSuccess(false);
            }}
            className="card"
            style={{
              padding: '20px',
              cursor: 'pointer',
              borderColor: selectedService === s.id ? 'var(--amber-500)' : 'var(--border-subtle)',
              backgroundColor: selectedService === s.id ? 'var(--bg-card)' : 'var(--bg-surface)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {s.title}
              </span>
              <span className="badge badge-amber font-mono" style={{ fontSize: '13px', fontWeight: 700 }}>
                {s.price} ALGO
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', minHeight: '44px' }}>
              {s.desc}
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Endpoint: {s.resource}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive x402 Execution Box */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Execute {currentService.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Micropayment fee: <b className="font-mono" style={{ color: 'var(--amber-500)' }}>{currentService.price} ALGO</b> (~$0.05 USD)
            </p>
          </div>

          {!challenge ? (
            <button
              onClick={handleRequestChallenge}
              disabled={isLoading}
              className="btn btn-amber"
              style={{ gap: '6px' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Issuing 402 Challenge...</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>Request Premium Access (HTTP 402)</span>
                </>
              )}
            </button>
          ) : (
            <button onClick={() => setChallenge(null)} className="btn btn-secondary btn-sm">
              Reset Challenge
            </button>
          )}
        </div>

        {/* Challenge Box Display */}
        {challenge && (
          <div
            style={{
              padding: '18px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-amber font-mono">HTTP 402 PAYMENT REQUIRED</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>AlgoKit Facilitator Challenge Issued</span>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Nonce valid for {challenge.expires_in_seconds}s
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12px' }} className="font-mono">
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>ESCROW VAULT (RECEIVER)</div>
                <div style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{challenge.destination_address}</div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>CHALLENGE TOKEN (HMAC NONCE)</div>
                <div style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{challenge.challenge_token.slice(0, 32)}...</div>
              </div>
            </div>

            {/* Payment Action */}
            {!paymentSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Authorize transaction from connected wallet ({challenge.amount_algo} ALGO)
                </span>

                <button
                  onClick={handleSimulatePayment}
                  disabled={isPaying}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  {isPaying ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Broadcasting to Algorand Testnet...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Sign & Broadcast {challenge.amount_algo} ALGO</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--emerald-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={22} style={{ color: 'var(--emerald-500)' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--emerald-500)' }}>
                      Payment Confirmed on Algorand Testnet!
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      TxHash: {txHash}
                    </div>
                  </div>
                </div>

                <div className="badge badge-emerald font-mono" style={{ padding: '6px 12px' }}>
                  <span>✓ 200 OK • Resource Gated Token Unlocked</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Chain Transaction Ledger */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--teal-500)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              On-Chain x402 Settlement Ledger
            </h3>
          </div>
          <span className="badge badge-neutral font-mono">{paymentRecords.length} Transactions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paymentRecords.map(rec => (
            <div
              key={rec.tx_id}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {rec.service_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="font-mono">
                  Tx: {rec.tx_id} • Block: #{rec.block_number}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-amber font-mono" style={{ fontWeight: 700 }}>
                  {rec.amount_algo} ALGO
                </span>
                <span className="badge badge-emerald font-mono">
                  {rec.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
