# app/services/skill_map.py
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from app.api.models import (
    UserProfile, 
    SkillMap, 
    SkillNode,
    SkillResource,
    LearningPreferences,
    ProgressData,
    ContextChange
)
from app.services.skill_agent import SkillMappingAgent
import motor.motor_asyncio
from bson import ObjectId
from app.core.config import settings

class SkillMapService:
    def __init__(self):
        # Connect to MongoDB
        self.client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
        self.db = self.client.get_database()
        self.skill_maps = self.db.skill_maps
        self.agent = SkillMappingAgent()
            
    async def generate_skill_program(
        self,
        skill_name: str,
        user_profile: Optional[UserProfile] = None,
        preferences: Optional[LearningPreferences] = None
    ) -> SkillProgram:
        """
        Generate a 30-day skill program using the agent
        """
        try:
            # Convert Pydantic models to dictionaries for the agent
            user_profile_dict = user_profile.dict() if user_profile else None
            preferences_dict = preferences.dict() if preferences else None
            
            # Use the agent to generate the 30-day skill program
            result = await self.agent.generate_skill_hierarchy(
                skill_name=skill_name,
                user_profile=user_profile_dict,
                learning_preferences=preferences_dict,
                time_frame=30  # Fixed to 30 days
            )
            
            # Process the result to create daily tasks
            skill_program_data = result["skill_program"]
            daily_tasks = []
            
            for task_data in skill_program_data["daily_tasks"]:
                resources = [
                    SkillResource(
                        type=resource["type"],
                        name=resource["name"],
                        url=resource.get("url", ""),
                        description=resource.get("description", "")
                    )
                    for resource in task_data.get("resources", [])
                ]
                
                daily_task = DailyTask(
                    day=task_data["day"],
                    name=task_data["name"],
                    description=task_data["description"],
                    difficulty_level=task_data["difficulty_level"],
                    estimated_hours=task_data["estimated_hours"],
                    resources=resources,
                    progress=0.0,
                    status="not_started"
                )
                
                daily_tasks.append(daily_task)
            
            # Calculate total hours
            total_hours = sum(task.estimated_hours for task in daily_tasks)
            
            # Set expected completion date (30 days from now)
            expected_completion = datetime.now() + timedelta(days=30)
            
            # Create the skill program document
            skill_program_doc = {
                "skill_name": skill_program_data["skill_name"],
                "description": skill_program_data["description"],
                "total_hours": total_hours,
                "daily_tasks": [task.dict() for task in daily_tasks],
                "expected_completion_date": expected_completion,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Add user_id if available
            if user_profile:
                skill_program_doc["user_id"] = user_profile.user_id
            
            # Save to MongoDB
            result = await self.skill_maps.insert_one(skill_program_doc)
            skill_program_id = str(result.inserted_id)
            
            # Create SkillProgram object
            skill_program = SkillProgram(
                id=skill_program_id,
                skill_name=skill_program_data["skill_name"],
                description=skill_program_data["description"],
                total_hours=total_hours,
                daily_tasks=daily_tasks,
                expected_completion_date=expected_completion
            )
            
            return skill_program
        
        except Exception as e:
            print(f"Error generating skill program: {str(e)}")
            raise

    async def update_task_progress(
        self,
        user_id: str,
        skill_program_id: str,
        progress_data: List[ProgressData],
        context_changes: Optional[List[ContextChange]] = None
    ) -> SkillProgram:
        """
        Update progress for daily tasks
        """
        try:
            # Retrieve the skill program from MongoDB
            skill_program_doc = await self.skill_maps.find_one({"_id": ObjectId(skill_program_id)})
            
            if not skill_program_doc:
                raise ValueError(f"Skill program with ID {skill_program_id} not found")
            
            # Convert MongoDB document to list of DailyTask objects
            daily_tasks = []
            for task_data in skill_program_doc["daily_tasks"]:
                resources = [
                    SkillResource(**resource) for resource in task_data.get("resources", [])
                ]
                
                task = DailyTask(
                    day=task_data["day"],
                    name=task_data["name"],
                    description=task_data["description"],
                    difficulty_level=task_data["difficulty_level"],
                    estimated_hours=task_data["estimated_hours"],
                    resources=resources,
                    progress=task_data.get("progress", 0.0),
                    status=task_data.get("status", "not_started")
                )
                daily_tasks.append(task)
            
            # Update progress for each task
            for progress in progress_data:
                # Find the task by day number (assuming node_id is the day number as a string)
                day = int(progress.node_id)
                for task in daily_tasks:
                    if task.day == day:
                        task.progress = progress.completion_percentage
                        task.status = self._determine_status(progress.completion_percentage)
            
            # If there are context changes, adjust the expected completion date
            expected_completion_date = skill_program_doc["expected_completion_date"]
            if context_changes:
                # Simple time adjustment based on impact factors
                total_impact = sum(change.impact_factor for change in context_changes)
                days_adjustment = int(total_impact * 30)
                expected_completion_date += timedelta(days=days_adjustment)
            
            # Update in MongoDB
            await self.skill_maps.update_one(
                {"_id": ObjectId(skill_program_id)},
                {
                    "$set": {
                        "daily_tasks": [task.dict() for task in daily_tasks],
                        "expected_completion_date": expected_completion_date,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            # Create SkillProgram object for response
            skill_program = SkillProgram(
                id=skill_program_id,
                skill_name=skill_program_doc["skill_name"],
                description=skill_program_doc["description"],
                total_hours=skill_program_doc["total_hours"],
                daily_tasks=daily_tasks,
                expected_completion_date=expected_completion_date
            )
            
            return skill_program
        except Exception as e:
            print(f"Error updating task progress: {str(e)}")
            raise
    
    def _create_nodes_from_llm_output(self, skills_data: Dict[str, Any]) -> Dict[str, SkillNode]:
        """Convert LLM output to SkillNode dictionary"""
        nodes = {}
        
        # Create nodes for each skill
        for skill_id, skill_data in skills_data.items():
            resources = [
                SkillResource(
                    type=resource["type"],
                    name=resource["name"],
                    url=resource.get("url"),
                    description=resource.get("description")
                )
                for resource in skill_data.get("resources", [])
            ]
            
            node = SkillNode(
                id=skill_id,
                name=skill_data["name"],
                description=skill_data["description"],
                estimated_hours=skill_data["estimated_hours"],
                parent_id=skill_data.get("parent_id"),
                children=skill_data.get("children", []),
                resources=resources,
                depth=skill_data.get("depth", 0),
                progress=0.0,
                status="not_started"
            )
            
            nodes[skill_id] = node
        
        return nodes
    
    def _determine_status(self, completion_percentage: float) -> str:
        """Determine the status based on completion percentage"""
        if completion_percentage == 0:
            return "not_started"
        elif completion_percentage < 100:
            return "in_progress"
        else:
            return "completed"
            
    def _mock_skill_hierarchy(self, skill_name: str) -> Dict[str, Any]:
        """
        Create a mock hierarchical skill structure
        In a real implementation, this would call an LLM
        """
        if skill_name.lower() == "machine learning":
            return {
                "skills": {
                    "root": {
                        "name": "Machine Learning",
                        "description": "The field of study that gives computers the ability to learn without being explicitly programmed",
                        "estimated_hours": 0, # Parent nodes don't have their own hours
                        "parent_id": None,
                        "children": ["fundamentals", "core-algorithms", "advanced-topics"],
                        "depth": 0,
                        "resources": [
                            {"type": "book", "name": "Hands-On Machine Learning with Scikit-Learn and TensorFlow"}
                        ]
                    },
                    "fundamentals": {
                        "name": "Fundamentals",
                        "description": "The essential building blocks for machine learning",
                        "estimated_hours": 0,
                        "parent_id": "root",
                        "children": ["math-foundations", "programming", "data-analysis"],
                        "depth": 1,
                        "resources": [
                            {"type": "course", "name": "Introduction to Machine Learning Fundamentals"}
                        ]
                    },
                    # Add more nodes...
                }
            }
        else:
            # Generic skill hierarchy for any other skill
            return {
                "skills": {
                    "root": {
                        "name": skill_name,
                        "description": f"Master the skill of {skill_name}",
                        "estimated_hours": 0,
                        "parent_id": None,
                        "children": ["fundamentals", "intermediate", "advanced"],
                        "depth": 0,
                        "resources": [
                            {"type": "book", "name": f"Introduction to {skill_name}"}
                        ]
                    },
                    "fundamentals": {
                        "name": f"{skill_name} Fundamentals",
                        "description": f"The basic concepts of {skill_name}",
                        "estimated_hours": 20,
                        "parent_id": "root",
                        "children": ["basics-1", "basics-2"],
                        "depth": 1,
                        "resources": [
                            {"type": "course", "name": f"Fundamentals of {skill_name}"}
                        ]
                    },
                    "basics-1": {
                        "name": "Core Concepts",
                        "description": f"Essential knowledge for understanding {skill_name}",
                        "estimated_hours": 10,
                        "parent_id": "fundamentals",
                        "children": [],
                        "depth": 2,
                        "resources": [
                            {"type": "article", "name": f"{skill_name} Core Concepts Explained"}
                        ]
                    },
                    "basics-2": {
                        "name": "Basic Techniques",
                        "description": f"Fundamental techniques in {skill_name}",
                        "estimated_hours": 15,
                        "parent_id": "fundamentals",
                        "children": [],
                        "depth": 2,
                        "resources": [
                            {"type": "video", "name": f"Basic {skill_name} Techniques"}
                        ]
                    },
                    "intermediate": {
                        "name": f"Intermediate {skill_name}",
                        "description": f"Build on your {skill_name} fundamentals",
                        "estimated_hours": 30,
                        "parent_id": "root",
                        "children": ["intermediate-1", "intermediate-2"],
                        "depth": 1,
                        "resources": [
                            {"type": "book", "name": f"{skill_name} in Practice"}
                        ]
                    },
                    "intermediate-1": {
                        "name": "Applied Techniques",
                        "description": f"Practical applications of {skill_name}",
                        "estimated_hours": 15,
                        "parent_id": "intermediate",
                        "children": [],
                        "depth": 2,
                        "resources": [
                            {"type": "course", "name": f"Applied {skill_name}"}
                        ]
                    },
                    "intermediate-2": {
                        "name": "Problem Solving",
                        "description": f"Solving common problems in {skill_name}",
                        "estimated_hours": 15,
                        "parent_id": "intermediate",
                        "children": [],
                        "depth": 2,
                        "resources": [
                            {"type": "tutorial", "name": f"{skill_name} Problem Solving Workshop"}
                        ]
                    },
                    "advanced": {
                        "name": f"Advanced {skill_name}",
                        "description": f"Master advanced concepts in {skill_name}",
                        "estimated_hours": 40,
                        "parent_id": "root",
                        "children": ["advanced-1", "advanced-2"],
                        "depth": 1,
                        "resources": [
                            {"type": "project", "name": f"Build an Advanced {skill_name} Project"}
                        ]
                    },
                    "advanced-1": {
                        "name": "Expert Techniques",
                        "description": f"Advanced methods used by {skill_name} experts",
                        "estimated_hours": 20,
                        "parent_id": "advanced",
                        "children": [],
                        "depth": 2,
                        "resources": [
                            {"type": "course", "name": f"Expert {skill_name} Techniques"}
                        ]
                    },
                    "advanced-2": {
                        "name": "Mastery Project",
                        "description": f"Comprehensive project to demonstrate {skill_name} mastery",
                        "estimated_hours": 20,
                        "parent_id": "advanced",
                        "children": [],
                        "depth": 2,
                        "resources": [
                            {"type": "project", "name": f"{skill_name} Mastery Project"}
                        ]
                    }
                }
            }