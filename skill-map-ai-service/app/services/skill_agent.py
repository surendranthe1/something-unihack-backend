# app/services/skill_agent.py
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from typing import Dict, List, Any, Optional
import json
import os
from datetime import datetime
from app.core.config import settings

class SkillMappingAgent:
    """Agent for decomposing skills into hierarchical learning paths"""
    
    def __init__(self):
        # Initialize the language model
        self.llm = ChatOpenAI(
            model=settings.DEFAULT_MODEL,
            temperature=0.2,
            api_key=settings.OPENAI_API_KEY
        )
        
        # Create tools
        self.tools = self._create_tools()
        
        # Create the agent
        self.agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self._create_prompt()
        )
        
        # Create the agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=50,
        )
    
    def _create_tools(self) -> List[Tool]:
        """Create the tools for the agent"""
        return [
            # Tool(
            #     name="search_educational_resources",
            #     func=self._search_educational_resources,
            #     description="Search for educational resources related to a specific skill or topic. Input should be the skill or topic name."
            # ),
            # Tool(
            #     name="estimate_learning_time",
            #     func=self._estimate_learning_time,
            #     description="Estimate the time required to learn a skill based on complexity and user's background. Input should be a JSON string with 'skill', 'complexity' (1-10), and 'background' fields."
            # ),
            # Tool(
            #     name="analyze_skill_prerequisites",
            #     func=self._analyze_skill_prerequisites,
            #     description="Analyze what prerequisites are needed for a given skill. Input should be the skill name."
            # )
        ]
    
    def _create_prompt(self) -> PromptTemplate:
        """Create the prompt for the agent"""
        return PromptTemplate.from_template("""
        You are a world-class educational expert specializing in skill development and daily learning task creation.
        Your task is to create a 30-day skill development program with daily tasks.
        
        ## Guidelines for 30-Day Skill Program:
        1. Create exactly 30 daily skill tasks that progress in difficulty
        2. Ensure a logical progression from fundamentals to advanced topics
        3. Each day should build upon previous learning
        4. Assign reasonable time estimates to each daily task
        5. Include specific learning resources for each task
        6. Consider the user's background, learning style, and time constraints
        7. Make tasks achievable within the day's time frame
        8. Ensure all 30 days together lead to meaningful skill development
        
        ## Output Format:
        Your final answer must be valid JSON matching this structure:
        ```json
        {{
        "skill_program": {{
            "skill_name": "Main Skill Name",
            "description": "Overall description of the 30-day program",
            "total_hours": 0,
            "daily_tasks": [
                {{
                    "day": 1,
                    "name": "Task Name",
                    "description": "Detailed description of the task",
                    "difficulty_level": "Beginner",
                    "estimated_hours": 1,
                    "resources": [
                        {{
                            "type": "article",
                            "name": "Resource Name",
                            "url": "URL"
                        }}
                    ]
                }},
                ...
            ]
        }}
        }}
        ```
        
        ## Input Information:
        - Skill to learn: {skill_name}
        - User profile: {user_profile}
        - Learning preferences: {learning_preferences}
        - Time frame: 30 days
        
        ## Tools Available
        You have access to the following tools:
        
        {tools}
        
        Use the following format EXACTLY:
        
        Question: the input question you must answer
        Thought: you should always think about what to do
        Action: the action to take, should be one of [{tool_names}]
        Action Input: the input to the action, should be a string
        Observation: the result of the action
        ... (this Thought/Action/Action Input/Observation can repeat N times)
        Thought: I now know the final answer
        Final Answer: the final answer to the original input question. Do not use ellipses or placeholders in JSON output. Provide the complete JSON.
        
        Begin! Remember to use the exact format shown above.
        
        Question: Generate a 30-day skill program for {skill_name} based on the provided information.
        {agent_scratchpad}
        """)
    
    async def generate_skill_hierarchy(
        self,
        skill_name: str,
        user_profile: Optional[Dict[str, Any]] = None,
        learning_preferences: Optional[Dict[str, Any]] = None,
        time_frame: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a 30-day skill program using the agent
        """
        # Prepare input for the agent
        input_data = {
            "skill_name": skill_name,
            "user_profile": json.dumps(user_profile) if user_profile else "None",
            "learning_preferences": json.dumps(learning_preferences) if learning_preferences else "None",
            "time_frame": 30  # Fixed to 30 days
        }
        
        try:
            # Execute the agent
            response = await self.agent_executor.ainvoke(input_data)
            
            # Extract the final answer
            result = response.get("output", "")

            # Log the complete response to a text file
            log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
            os.makedirs(log_dir, exist_ok=True)
            
            log_file = os.path.join(log_dir, f"llm_response_{skill_name.replace(' ', '_')}.txt")
            with open(log_file, "w") as f:
                f.write(f"===== FULL LLM RESPONSE =====\n")
                f.write(f"Skill: {skill_name}\n")
                f.write(result)
                f.write("\n\n===== END RESPONSE =====\n")
            
            print(f"LLM response logged to: {log_file}")
            
            # Parse the JSON from the result
            try:
                # First, try to find JSON within the response using pattern matching
                import re
                json_match = re.search(r'```json\s*(.*?)\s*```', result, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    json_str = result
                    
                # Clean up the string if needed
                json_str = json_str.strip()
                if json_str.startswith("```") and json_str.endswith("```"):
                    json_str = json_str[3:-3].strip()
                
                # Parse the JSON
                skill_data = json.loads(json_str)
            
                return skill_data
            except json.JSONDecodeError as json_error:
                # If JSON parsing fails, return a simplified structure
                print(f"JSON parse error: {json_error}")
                print(f"Failed to parse: {json_str}")
                return {
                    "skill_program": {
                        "skill_name": skill_name,
                        "description": f"30-day skill program for {skill_name}",
                        "total_hours": 30,
                        "daily_tasks": [
                            {
                                "day": i,
                                "name": f"Day {i} of {skill_name}",
                                "description": f"Basic task for day {i}",
                                "difficulty_level": "Beginner",
                                "estimated_hours": 1,
                                "resources": [{"type": "general", "name": "Introduction resources"}]
                            } for i in range(1, 31)
                        ]
                    }
                }
        except Exception as exec_error:
            print(f"Agent execution error: {exec_error}")
            # Return simplified structure
            return {
                "skill_program": {
                    "skill_name": skill_name,
                    "description": f"30-day skill program for {skill_name}",
                    "total_hours": 30,
                    "daily_tasks": [
                        {
                            "day": i,
                            "name": f"Day {i} of {skill_name}",
                            "description": f"Basic task for day {i}",
                            "difficulty_level": "Beginner",
                            "estimated_hours": 1,
                            "resources": [{"type": "general", "name": "Introduction resources"}]
                        } for i in range(1, 31)
                    ]
                }
            }
    
    def _search_educational_resources(self, query: str) -> str:
        """
        Mock tool to search for educational resources
        In a production environment, this would connect to an API or database
        """
        resources = {
            "machine learning": [
                {"type": "course", "name": "Machine Learning by Andrew Ng", "url": "https://www.coursera.org/learn/machine-learning"},
                {"type": "book", "name": "Hands-On Machine Learning with Scikit-Learn and TensorFlow"},
                {"type": "video", "name": "StatQuest with Josh Starmer", "url": "https://www.youtube.com/c/joshstarmer"}
            ],
            "web development": [
                {"type": "course", "name": "The Complete Web Developer in 2023", "url": "https://www.udemy.com/course/the-complete-web-developer-zero-to-mastery/"},
                {"type": "documentation", "name": "MDN Web Docs", "url": "https://developer.mozilla.org/"},
                {"type": "tutorial", "name": "W3Schools", "url": "https://www.w3schools.com/"}
            ],
            "python": [
                {"type": "course", "name": "Python for Everybody", "url": "https://www.py4e.com/"},
                {"type": "book", "name": "Automate the Boring Stuff with Python", "url": "https://automatetheboringstuff.com/"},
                {"type": "documentation", "name": "Python Documentation", "url": "https://docs.python.org/3/"}
            ]
        }
        
        # Simple keyword matching
        query = query.lower()
        found_resources = []
        
        for key, value in resources.items():
            if key in query or query in key:
                found_resources.extend(value)
        
        if not found_resources:
            # Return some generic resources
            return "No specific resources found. Consider general learning platforms like Coursera, Udemy, or YouTube."
        
        return json.dumps(found_resources[:3])
    
    def _estimate_learning_time(self, input_str: str) -> str:
        """
        Estimate the time required to learn a skill
        Input should be a JSON string with skill, complexity, and background
        """
        try:
            # Clean the input string
            cleaned_input = input_str.strip()
            if cleaned_input.startswith("'") and cleaned_input.endswith("'"):
                cleaned_input = cleaned_input[1:-1]
            if cleaned_input.startswith('"') and cleaned_input.endswith('"'):
                cleaned_input = cleaned_input[1:-1]
            if cleaned_input.startswith('`') and cleaned_input.endswith('`'):
                cleaned_input = cleaned_input[1:-1]
            
            # Parse the JSON
            input_data = json.loads(cleaned_input)
            skill = input_data.get("skill", "")
            complexity = input_data.get("complexity", 5)
            background = input_data.get("background", "")
            
            # Base time in hours based on complexity (1-10)
            base_time = complexity * 10
            
            # Adjust based on background
            if isinstance(background, list) and len(background) > 0:
                # Reduce time based on number of relevant items
                reduction = min(0.3, 0.1 * len(background))
                base_time = max(10, base_time * (1 - reduction))
            elif isinstance(background, str) and any(term in background.lower() for term in ["experience", "familiar", "background", "knowledge"]):
                base_time = max(10, base_time * 0.7)
            
            return f"Estimated time to learn {skill}: {base_time} hours"
        except Exception as error:
            print(f"Error in estimate_learning_time: {error}, Input: {input_str}")
            return "Invalid input. Please provide valid JSON with skill, complexity, and background fields."
    
    def _analyze_skill_prerequisites(self, skill: str) -> str:
        """
        Analyze prerequisites for a given skill
        """
        prerequisites = {
            "machine learning": ["mathematics", "statistics", "python programming", "data analysis"],
            "web development": ["html", "css", "javascript", "responsive design"],
            "data science": ["statistics", "python programming", "data visualization", "databases"],
            "python programming": ["basic programming concepts", "problem solving"],
            "javascript": ["html", "css", "programming fundamentals"]
        }
        
        skill = skill.lower()
        
        # Simple keyword matching
        for key, value in prerequisites.items():
            if key in skill or skill in key:
                return json.dumps(value)
        
        # Generic response if no match
        return json.dumps(["fundamental concepts", "basic principles"])