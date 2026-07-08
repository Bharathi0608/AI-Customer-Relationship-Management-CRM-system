# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.interaction import (
    InteractionCreate,
    InteractionResponse,
)
from app.services.crud import (
    create_interaction,
    get_interactions,
    get_interaction_by_id,
    update_interaction,
    delete_interaction,
)

router = APIRouter(
    prefix="/interactions",
    tags=["Interactions"],
)


@router.post("/", response_model=InteractionResponse)
def add_interaction(
    interaction: InteractionCreate,
    db: Session = Depends(get_db),
):
    return create_interaction(db, interaction)


@router.get("/", response_model=list[InteractionResponse])
def read_interactions(
    db: Session = Depends(get_db),
):
    return get_interactions(db)


@router.get("/{interaction_id}", response_model=InteractionResponse)
def read_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
):
    interaction = get_interaction_by_id(db, interaction_id)

    if not interaction:
        raise HTTPException(
            status_code=404,
            detail="Interaction not found",
        )

    return interaction


@router.put("/{interaction_id}", response_model=InteractionResponse)
def edit_interaction(
    interaction_id: int,
    interaction: InteractionCreate,
    db: Session = Depends(get_db),
):
    updated = update_interaction(
        db,
        interaction_id,
        interaction,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Interaction not found",
        )

    return updated


@router.delete("/{interaction_id}")
def remove_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_interaction(
        db,
        interaction_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Interaction not found",
        )

    return {
        "message": "Interaction deleted successfully"
    }