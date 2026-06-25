from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..services.transaction_service import create_transaction, get_transactions_for_account
from ..schemas.transaction import TransactionCreate, Transaction as TransactionSchema
from ..dependencies import get_db, get_current_user
from ..models import User, Account

router = APIRouter()

@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_tx(tx_in: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from_account = db.query(Account).filter(Account.id == tx_in.from_account_id).first()
    if not from_account or from_account.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to transfer from this account")
    try:
        tx = create_transaction(db, tx_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return tx

@router.get("/account/{account_id}", response_model=list[TransactionSchema])
def get_account_transactions(account_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account or account.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    txs = get_transactions_for_account(db, account_id, skip, limit)
    return txs
