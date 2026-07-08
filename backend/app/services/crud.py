# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.models.interaction import Interaction, ChatMessage
from app.schemas.interaction import InteractionCreate


def create_chat_message(db: Session, role: str, content: str):
    db_msg = ChatMessage(role=role, content=content)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg


def create_interaction(db: Session, interaction: InteractionCreate):
    db_interaction = Interaction(
        hcp_name=interaction.hcp_name,
        interaction_type=interaction.interaction_type,
        interaction_date=interaction.interaction_date,
        interaction_time=interaction.interaction_time,
        attendees=interaction.attendees,
        topics_discussed=interaction.topics_discussed,
        materials_shared=interaction.materials_shared,
        samples_distributed=interaction.samples_distributed,
        sentiment=interaction.sentiment,
        outcomes=interaction.outcomes,
        follow_up_actions=interaction.follow_up_actions,
    )

    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)

    return db_interaction


def get_interactions(db: Session):
    return db.query(Interaction).all()


def get_interaction_by_id(db: Session, interaction_id: int):
    return (
        db.query(Interaction)
        .filter(Interaction.id == interaction_id)
        .first()
    )


def update_interaction(
    db: Session,
    interaction_id: int,
    interaction: InteractionCreate,
):
    db_interaction = (
        db.query(Interaction)
        .filter(Interaction.id == interaction_id)
        .first()
    )

    if not db_interaction:
        return None

    db_interaction.hcp_name = interaction.hcp_name
    db_interaction.interaction_type = interaction.interaction_type
    db_interaction.interaction_date = interaction.interaction_date
    db_interaction.interaction_time = interaction.interaction_time
    db_interaction.attendees = interaction.attendees
    db_interaction.topics_discussed = interaction.topics_discussed
    db_interaction.materials_shared = interaction.materials_shared
    db_interaction.samples_distributed = interaction.samples_distributed
    db_interaction.sentiment = interaction.sentiment
    db_interaction.outcomes = interaction.outcomes
    db_interaction.follow_up_actions = interaction.follow_up_actions

    db.commit()
    db.refresh(db_interaction)

    return db_interaction


def delete_interaction(db: Session, interaction_id: int):
    db_interaction = (
        db.query(Interaction)
        .filter(Interaction.id == interaction_id)
        .first()
    )

    if not db_interaction:
        return None

    db.delete(db_interaction)
    db.commit()

    return db_interaction