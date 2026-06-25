from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from . import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    balance = Column(Numeric(12, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="accounts")
    transactions_from = relationship("Transaction", back_populates="from_account", foreign_keys="Transaction.from_account_id")
    transactions_to = relationship("Transaction", back_populates="to_account", foreign_keys="Transaction.to_account_id")
