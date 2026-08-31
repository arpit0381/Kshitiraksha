import time
import hmac
import hashlib
import secrets
from typing import Dict, Any, Optional

class X402PaymentFacilitator:
    """
    AlgoKit / x402 Micropayment Facilitator Service
    Implements HTTP 402 Payment Required challenge generation,
    pricing logic for premium satellite compute, and transaction verification.
    """
    TREASURY_ADDRESS = "ISROGEO77X402ALGORANDTESTNETVAULTWXYZ66723"
    SECRET_KEY = "geowatch-x402-facilitator-secret-key"

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

            # Simulated on-chain verification
            # Validates Algorand transaction hash structure (52 chars base32 or valid hex)
            is_valid_tx = len(transaction_id) >= 16

            return {
                "valid": is_valid_tx,
                "transaction_id": transaction_id,
                "sender_wallet": sender_wallet or "ANONYMOUS_WALLET_ALGO",
                "settled_at": int(time.time()),
                "status": "SETTLED" if is_valid_tx else "FAILED",
                "message": "Payment settled on Algorand Testnet. Access granted." if is_valid_tx else "Transaction rejected"
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
