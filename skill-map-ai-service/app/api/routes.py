# app/api/routes.py
from fastapi import APIRouter, HTTPException, Depends
from app.api.models import (
    UserProfile, 
    SkillMapRequest, 
    SkillMapResponse,
    ProgressUpdateRequest,
    ProgressUpdateResponse
)
from app.services.skill_map import SkillMapService

router = APIRouter()
skill_service = SkillMapService()

@router.post("/generate_skill_map", response_model=SkillMapResponse)
async def generate_skill_map(request: SkillMapRequest):
    """
    Generate a hierarchical skill map based on a target skill
    """
    try:
        skill_map = await skill_service.generate_skill_map(
            skill_name=request.skill_name,
            user_profile=request.user_profile,
            time_frame=request.time_frame,
            preferences=request.learning_preferences
        )
        return SkillMapResponse(
            skill_map=skill_map,
            user_id=request.user_profile.user_id if request.user_profile else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update_progress", response_model=ProgressUpdateResponse)
async def update_progress(request: ProgressUpdateRequest):
    """
    Update progress on a skill map
    """
    try:
        updated_map = await skill_service.update_progress(
            user_id=request.user_id,
            skill_map_id=request.skill_map_id,
            progress_data=request.progress_data,
            context_changes=request.context_changes
        )
        return ProgressUpdateResponse(
            updated_skill_map=updated_map,
            user_id=request.user_id,
            skill_map_id=request.skill_map_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))