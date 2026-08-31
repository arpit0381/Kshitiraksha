import React, { useState } from 'react';
import { X402Challenge } from '../../types';
import { ApiService } from '../../services/api';
import { Zap, CheckCircle2, Shield, ArrowRight, Wallet, Copy, ExternalLink, RefreshCw } from 'lucide-react';

interface X402PaymentModalProps {
  onClose?: () => void;
}

export const X402PaymentModal: React.FC<X402PaymentModalProps> = () => {
  const [selectedService, setSelectedService] = useState<'PRIORITY_SCAN' | 'GEOTIFF_EXPORT' | 'HIGH_FREQ'>('PRIORITY_SCAN');
  const [challenge, setChallenge] = useState<X402Challenge | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('ALGO7KSHITIRAKSHATESTNETUSER9823VAULT');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');

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
    }
  ];

  const currentService = services.find(s => s.id === selectedService)!;

  const handleRequestChallenge = async () => {
    setIsLoading(true);
    setPaymentSuccess(false);
    const chal = await ApiService.getX402Challenge(currentService.resource);
    chal.amount_algo = currentService.price;
    setChallenge(chal);
    setIsLoading(false);
  };

  const handleSimulatePayment = async () => {
    if (!challenge) return;
    setIsPaying(true);
    
    // Simulate Algorand Testnet block commitment
    await new Promise(r => setTimeout(r, 1200));
    const mockTx = `ALGO-TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setTxHash(mockTx);

    const result = await ApiService.verifyX402Payment(challenge.challenge_token, mockTx, walletAddress);
    setIsPaying(false);
    if (result.success) {
      setPaymentSuccess(true);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <span className="badge badge-amber font-mono">Algorand Testnet</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '850px' }}>
              Decentralized pay-per-request monetization for heavy satellite raster computations.
              Clients receive an HTTP 402 challenge, sign an ALGO micro-transaction, and immediately receive priority clearance.
            </p>
          </div>

          {/* Wallet State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {walletConnected ? (
              <div className="badge badge-emerald font-mono" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Wallet size={14} />
                <span>{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
              </div>
            ) : (
              <button
                onClick={() => setWalletConnected(true)}
                className="btn btn-secondary btn-sm"
              >
                <Wallet size={14} />
                <span>Connect Algorand Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {s.title}
              </span>
              <span className="badge badge-amber font-mono" style={{ fontSize: '13px', fontWeight: 700 }}>
                {s.price} ALGO
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '48px' }}>
              {s.desc}
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Resource: {s.resource}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive x402 Execution Box */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Execute {currentService.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Target fee: <b className="font-mono" style={{ color: 'var(--amber-500)' }}>{currentService.price} ALGO</b> (~$0.05 USD)
            </p>
          </div>

          {!challenge ? (
            <button
              onClick={handleRequestChallenge}
              disabled={isLoading}
              className="btn btn-amber"
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
              padding: '16px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-amber font-mono">HTTP 402 PAYMENT REQUIRED</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Protocol Challenge Received</span>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Nonce valid for {challenge.expires_in_seconds}s
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px' }} className="font-mono">
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>VAULT ADDRESS (RECEIVER)</div>
                <div style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{challenge.destination_address}</div>
              </div>

              <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>CHALLENGE TOKEN (HMAC)</div>
                <div style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{challenge.challenge_token.slice(0, 32)}...</div>
              </div>
            </div>

            {/* Payment Action */}
            {!paymentSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Sign transaction with connected Algorand wallet ({challenge.amount_algo} ALGO)
                </span>

                <button
                  onClick={handleSimulatePayment}
                  disabled={isPaying}
                  className="btn btn-primary"
                >
                  {isPaying ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Broadcasting to Algorand Testnet...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Sign & Settle {challenge.amount_algo} ALGO</span>
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

                <button className="btn btn-primary btn-sm">
                  <span>Access High-Priority Compute Stream</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
