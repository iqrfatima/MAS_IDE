from sqlalchemy import Column, Integer, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from . import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    from_account = relationship("Account", back_populates="transactions_from", foreign_keys=[from_account_id])
    to_account = relationship("Account", back_populates="transactions_to", foreign_keys=[to_account_id])
