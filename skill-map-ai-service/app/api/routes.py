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

@router.post("/generate_skill_program", response_model=SkillProgramResponse)
async def generate_skill_program(request: SkillProgramRequest):
    """
    Generate a 30-day skill program based on a target skill
    """
    try:
        skill_program = await skill_service.generate_skill_program(
            skill_name=request.skill_name,
            user_profile=request.user_profile,
            preferences=request.learning_preferences
        )
        return SkillProgramResponse(
            skill_program=skill_program,
            user_id=request.user_profile.user_id if request.user_profile else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/task/update_progress", response_model=ProgressUpdateResponse)
async def update_task_progress(request: ProgressUpdateRequest):
    """
    Update progress on daily tasks
    """
    try:
        updated_program = await skill_service.update_task_progress(
            user_id=request.user_id,
            skill_program_id=request.skill_map_id,
            progress_data=request.progress_data,
            context_changes=request.context_changes
        )
        return ProgressUpdateResponse(
            updated_skill_map=updated_program,  # Note: The response model will need to be updated
            user_id=request.user_id,
            skill_map_id=request.skill_map_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/router-test")
async def router_test_endpoint():
    return {"message": "Router test endpoint works!"}