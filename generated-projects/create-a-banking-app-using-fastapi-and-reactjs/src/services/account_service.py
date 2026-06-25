from sqlalchemy.orm import Session
from typing import List
from ..models import Account, User
from ..schemas.account import AccountCreate, AccountUpdate, Account as AccountSchema

def create_account(db: Session, user: User, account_in: AccountCreate) -> Account:
    account = Account(owner_id=user.id, balance=account_in.initial_balance, currency=account_in.currency)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

def get_account(db: Session, account_id: int) -> Account | None:
    return db.query(Account).filter(Account.id == account_id).first()

def get_user_accounts(db: Session, user: User) -> List[Account]:
    return db.query(Account).filter(Account.owner_id == user.id).all()

def update_account(db: Session, account: Account, account_in: AccountUpdate) -> Account:
    if account_in.currency is not None:
        account.currency = account_in.currency
    db.commit()
    db.refresh(account)
    return account

def delete_account(db: Session, account: Account) -> None:
    db.delete(account)
    db.commit()
