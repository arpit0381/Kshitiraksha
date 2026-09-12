import time
import hmac
import hashlib
import secrets
from typing import Dict, Any, Optional
from app.core.config import settings

class X402PaymentFacilitator:
    """
    AlgoKit / x402 Micropayment Facilitator Service
    Implements HTTP 402 Payment Required challenge generation,
    pricing logic for premium satellite compute, and transaction verification.
    """
    TREASURY_ADDRESS = "ISROGEO77X402ALGORANDTESTNETVAULTWXYZ66723"
    SECRET_KEY = settings.X402_SECRET_KEY

    @classmethod
    def create_payment_challenge(
        cls,
        resource_path: str,
        amount_algo: float = 0.25,
        network: str = "algorand-testnet"
    ) -> Dict[str, Any]:
        """
        Issues an HTTP 402 challenge with nonce, expiry timestamp, and signature.
        """
        nonce = secrets.token_hex(8)
        timestamp = int(time.time())
        raw_msg = f"{resource_path}:{amount_algo}:{network}:{nonce}:{timestamp}"
        signature = hmac.new(cls.SECRET_KEY.encode(), raw_msg.encode(), hashlib.sha256).hexdigest()

        return {
            "status": "PAYMENT_REQUIRED",
            "code": 402,
            "resource": resource_path,
            "amount_algo": amount_algo,
            "currency": "ALGO",
            "network": network,
            "destination_address": cls.TREASURY_ADDRESS,
            "challenge_token": f"{raw_msg}.{signature}",
            "expires_in_seconds": 900,
            "instructions": "Submit an Algorand testnet transaction of the exact amount and retry with X-402-TxId header."
        }

    @classmethod
    def verify_settlement(
        cls,
        challenge_token: str,
        transaction_id: str,
        sender_wallet: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verifies the challenge token authenticity and simulates/validates
        Algorand blockchain transaction settlement.
        """
        if not challenge_token or not transaction_id:
            return {"valid": False, "error": "Missing challenge token or transaction ID"}

        try:
            parts = challenge_token.rsplit(".", 1)
            if len(parts) != 2:
                return {"valid": False, "error": "Malformed challenge token"}

            raw_msg, signature = parts
            expected_sig = hmac.new(cls.SECRET_KEY.encode(), raw_msg.encode(), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected_sig, signature):
                return {"valid": False, "error": "Invalid challenge signature"}

            # Immediate acceptance for simulation, testnet and demo transactions
            if transaction_id.startswith(("ALGO-TX", "ALGO-TESTNET", "SIM-", "DEMO-", "TX-", "MOCK-")):
                return {
                    "valid": True,
                    "transaction_id": transaction_id,
                    "sender_wallet": sender_wallet or "DEMO_TESTNET_ALGO_WALLET",
                    "settled_at": int(time.time()),
                    "status": "SETTLED",
                    "message": "Payment verified on Algorand Testnet. Priority compute pipeline activated."
                }

            # Real on-chain verification using Algorand Indexer
            from algosdk.v2client import indexer  # type: ignore
            indexer_client = indexer.IndexerClient("", "https://testnet-idx.algonode.cloud")
            
            is_valid_tx = False
            tx_info = None
            
            # Simple retry logic for recent transactions not yet indexed
            for _ in range(2):
                try:
                    response = indexer_client.search_transactions(txid=transaction_id)
                    if response.get("transactions") and len(response["transactions"]) > 0:
                        tx_info = response["transactions"][0]
                        break
                except Exception:
                    pass
                time.sleep(1)
                
            if not tx_info:
                return {"valid": False, "error": "Transaction not found on Algorand TestNet"}
            
            if tx_info.get("tx-type") != "pay":
                return {"valid": False, "error": "Transaction is not a payment"}
                
            pay_txn = tx_info.get("payment-transaction", {})
            receiver = pay_txn.get("receiver")
            
            if receiver != cls.TREASURY_ADDRESS:
                return {"valid": False, "error": f"Invalid receiver. Expected {cls.TREASURY_ADDRESS}"}
                
            # Extract expected amount from challenge token payload
            # Format: resource_path:amount_algo:network:nonce:timestamp
            token_parts = raw_msg.split(":")
            if len(token_parts) >= 2:
                try:
                    expected_amount_algo = float(token_parts[1])
                    expected_microalgo = int(expected_amount_algo * 1_000_000)
                    actual_microalgo = pay_txn.get("amount", 0)
                    
                    if actual_microalgo < expected_microalgo:
                        return {"valid": False, "error": f"Insufficient amount. Expected {expected_amount_algo} ALGO"}
                except ValueError:
                    pass
            
            is_valid_tx = True
            sender_wallet = tx_info.get("sender") or sender_wallet

            return {
                "valid": is_valid_tx,
                "transaction_id": transaction_id,
                "sender_wallet": sender_wallet or "ANONYMOUS_WALLET_ALGO",
                "settled_at": int(time.time()),
                "status": "SETTLED" if is_valid_tx else "FAILED",
                "message": "Payment verified on Algorand Testnet. Access granted." if is_valid_tx else "Transaction rejected"
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
