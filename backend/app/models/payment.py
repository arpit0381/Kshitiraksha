from sqlalchemy import Column, String, Float, DateTime, Integer
from sqlalchemy.sql import func
from app.db.base import Base

class X402PaymentRecord(Base):
    __tablename__ = "x402_payments"

    tx_id = Column(String, primary_key=True, index=True)
    resource = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    amount_algo = Column(Float, nullable=False)
    sender = Column(String, nullable=False)
    status = Column(String, default="CONFIRMED")
    block_number = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
