from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..models import Account, Transaction
from ..schemas.transaction import TransactionCreate, Transaction as TransactionSchema

def create_transaction(db: Session, tx_in: TransactionCreate) -> Transaction:
    from_acc = db.query(Account).filter(Account.id == tx_in.from_account_id).with_for_update().first()
    to_acc = db.query(Account).filter(Account.id == tx_in.to_account_id).with_for_update().first()
    if not from_acc or not to_acc:
        raise ValueError("Account not found")
    if from_acc.balance < tx_in.amount:
        raise ValueError("Insufficient funds")
    from_acc.balance -= tx_in.amount
    to_acc.balance += tx_in.amount
    tx = Transaction(from_account_id=from_acc.id, to_account_id=to_acc.id, amount=tx_in.amount)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

def get_transactions_for_account(db: Session, account_id: int, skip: int = 0, limit: int = 10) -> List[Transaction]:
    return db.query(Transaction).filter(
        (Transaction.from_account_id == account_id) | (Transaction.to_account_id == account_id)
    ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
