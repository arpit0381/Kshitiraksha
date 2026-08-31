from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse
from app.schemas.models import X402PaymentVerification
from app.services.x402_facilitator import X402PaymentFacilitator

router = APIRouter(prefix="/x402", tags=["x402 Algorand Payments"])

@router.get("/challenge")
def get_payment_challenge(
    resource: str = Query(..., description="Target premium compute resource path"),
    amount_algo: float = Query(0.25, description="Requested payment in ALGO")
):
    """
    Standard HTTP 402 Payment Required endpoint.
    Emits challenge headers and structured payload compliant with x402 specification.
    """
    challenge = X402PaymentFacilitator.create_payment_challenge(
        resource_path=resource,
        amount_algo=amount_algo,
        network="algorand-testnet"
    )

    auth_header = (
        f'x402 realm="GeoWatch Premium Compute", '
        f'resource="{resource}", '
        f'amount="{amount_algo}", '
        f'currency="ALGO", '
        f'destination="{challenge["destination_address"]}", '
        f'token="{challenge["challenge_token"]}"'
    )

    return JSONResponse(
        status_code=402,
        content=challenge,
        headers={"WWW-Authenticate": auth_header}
    )

@router.post("/verify")
def verify_payment(payload: X402PaymentVerification):
    """
    Verifies Algorand blockchain settlement and validates HMAC cryptographic challenge.
    """
    settlement = X402PaymentFacilitator.verify_settlement(
        challenge_token=payload.challenge_token,
        transaction_id=payload.transaction_id,
        sender_wallet=payload.sender_wallet
    )

    if not settlement.get("valid"):
        raise HTTPException(status_code=400, detail=settlement.get("error", "Invalid settlement"))

    return {
        "success": True,
        "message": settlement["message"],
        "transaction_id": settlement["transaction_id"],
        "settled_at": settlement["settled_at"]
    }
