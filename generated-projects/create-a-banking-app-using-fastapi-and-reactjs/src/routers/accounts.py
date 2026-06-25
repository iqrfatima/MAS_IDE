from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..services.account_service import create_account, get_account, get_user_accounts, update_account, delete_account
from ..schemas.account import AccountCreate, Account as AccountSchema, AccountUpdate
from ..dependencies import get_db, get_current_user
from ..models import User

router = APIRouter()

@router.post("/", response_model=AccountSchema, status_code=status.HTTP_201_CREATED)
def create_user_account(account_in: AccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = create_account(db, current_user, account_in)
    return account

@router.get("/", response_model=list[AccountSchema])
def read_user_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = get_user_accounts(db, current_user)
    return accounts

@router.get("/{account_id}", response_model=AccountSchema)
def read_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = get_account(db, account_id)
    if not account or account.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account

@router.put("/{account_id}", response_model=AccountSchema)
def update_user_account(account_id: int, account_in: AccountUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = get_account(db, account_id)
    if not account or account.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    updated = update_account(db, account, account_in)
    return updated

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = get_account(db, account_id)
    if not account or account.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    delete_account(db, account)
    return
