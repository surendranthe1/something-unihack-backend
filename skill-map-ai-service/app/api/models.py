# app/api/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime

class LearningStyle(str, Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    READING = "reading"
    KINESTHETIC = "kinesthetic"

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class TimeAvailability(BaseModel):
    hours_per_week: float
    preferred_session_length: Optional[float] = None
    preferred_days: Optional[List[str]] = None

class UserProfile(BaseModel):
    user_id: str
    current_skill_level: SkillLevel
    learning_style_preferences: List[LearningStyle]
    time_availability: TimeAvailability
    background_knowledge: List[str] = []
    goals: List[str] = []

class LearningPreferences(BaseModel):
    resource_types: List[str] = Field(default_factory=lambda: ["courses", "articles", "videos"])
    difficulty_progression: str = "gradual"
    focus_areas: Optional[List[str]] = None

class SkillResource(BaseModel):
    type: str
    name: str
    url: Optional[str] = None
    description: Optional[str] = None

class SkillNode(BaseModel):
    id: str
    name: str
    description: str
    estimated_hours: float
    parent_id: Optional[str] = None
    children: List[str] = []
    resources: List[SkillResource] = []
    depth: int = 0  # Depth in the tree (0 = root)
    progress: float = 0.0
    status: str = "not_started"

class SkillMap(BaseModel):
    id: str
    root_skill: str  # The main skill name
    nodes: Dict[str, SkillNode]  # Dictionary of id -> node
    total_estimated_hours: float
    expected_completion_date: datetime

class SkillMapRequest(BaseModel):
    skill_name: str
    user_profile: Optional[UserProfile] = None
    learning_preferences: Optional[LearningPreferences] = None
    time_frame: Optional[int] = None  # In days

class SkillMapResponse(BaseModel):
    skill_map: SkillMap
    user_id: Optional[str] = None
    
class ProgressData(BaseModel):
    node_id: str
    completion_percentage: float
    time_spent: float
    notes: Optional[str] = None
    assessment_results: Optional[Dict[str, Any]] = None

class ContextChange(BaseModel):
    change_type: str  # e.g., "travel", "schedule_change", "learning_pace"
    description: str
    impact_factor: float  # How much this affects the schedule (-1.0 to 1.0)
    affected_period: Dict[str, datetime]

class ProgressUpdateRequest(BaseModel):
    user_id: str
    skill_map_id: str
    progress_data: List[ProgressData]
    context_changes: Optional[List[ContextChange]] = None

class ProgressUpdateResponse(BaseModel):
    updated_skill_map: SkillMap
    user_id: str
    skill_map_id: str
    adjustment_summary: Optional[str] = None