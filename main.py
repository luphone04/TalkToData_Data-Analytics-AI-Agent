#!/usr/bin/env python3
"""
Data Analysis Agent - Interactive CLI
Run this script to start an interactive data analysis session.
"""

import asyncio
import os
import sys

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check for API key before importing agent (which requires it)
if not os.getenv("OPENAI_API_KEY"):
    print("Error: OPENAI_API_KEY not found.")
    print("Please create a .env file with your API key:")
    print("  cp .env.example .env")
    print("  # Then edit .env and add your key")
    sys.exit(1)

from agents import Runner
from agent import data_analyst


class ConversationHistory:
    """Manages conversation history for context-aware interactions."""

    def __init__(self):
        self.messages: list[dict] = []

    def add_user_message(self, content: str) -> None:
        """Add a user message to history."""
        self.messages.append({"role": "user", "content": content})

    def add_assistant_message(self, content: str) -> None:
        """Add an assistant message to history."""
        self.messages.append({"role": "assistant", "content": content})

    def get_context_prompt(self, new_message: str) -> str:
        """
        Build a prompt that includes relevant conversation context.
        Keeps last 5 exchanges to avoid token limits.
        """
        # Keep only recent history (last 10 messages = 5 exchanges)
        recent = self.messages[-10:] if len(self.messages) > 10 else self.messages

        if not recent:
            return new_message

        # Build context string
        context_parts = ["Previous conversation:"]
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            # Truncate long messages in context
            content = msg["content"][:500] + "..." if len(msg["content"]) > 500 else msg["content"]
            context_parts.append(f"{role}: {content}")

        context_parts.append(f"\nCurrent request: {new_message}")
        return "\n".join(context_parts)

    def clear(self) -> None:
        """Clear conversation history."""
        self.messages = []


def print_welcome():
    """Print welcome message and instructions."""
    print()
    print("=" * 50)
    print("  Data Analysis Agent")
    print("=" * 50)
    print()
    print("I can help you analyze CSV and Excel files.")
    print()
    print("Commands:")
    print("  • Type your question or request")
    print("  • 'clear' - Clear conversation history")
    print("  • 'quit'  - Exit the program")
    print()
    print("Tips:")
    print("  • Drop data files in the 'data/' folder")
    print("  • Ask 'What files are available?' to start")
    print("  • Charts are saved to the 'output/' folder")
    print()
    print("-" * 50)
    print()


async def run_agent(user_input: str, history: ConversationHistory) -> str:
    """
    Run the agent with the user's input and conversation context.
    Returns the agent's response.
    """
    # Build prompt with context
    prompt = history.get_context_prompt(user_input)

    # Run the agent
    result = await Runner.run(data_analyst, prompt)

    return result.final_output


async def main():
    """Main interactive loop."""
    print_welcome()

    history = ConversationHistory()

    while True:
        try:
            # Get user input
            user_input = input("You: ").strip()

            # Handle empty input
            if not user_input:
                continue

            # Handle commands
            if user_input.lower() in ('quit', 'exit', 'q'):
                print("\nGoodbye! Happy analyzing!\n")
                break

            if user_input.lower() == 'clear':
                history.clear()
                print("\nConversation history cleared.\n")
                continue

            if user_input.lower() == 'help':
                print_welcome()
                continue

            # Add user message to history
            history.add_user_message(user_input)

            # Show thinking indicator
            print("\nThinking...\n")

            # Run the agent
            response = await run_agent(user_input, history)

            # Add response to history
            history.add_assistant_message(response)

            # Print response
            print(f"Agent: {response}\n")

        except KeyboardInterrupt:
            print("\n\nInterrupted. Type 'quit' to exit.\n")
            continue

        except Exception as e:
            error_type = type(e).__name__

            # Handle specific error types
            if "AuthenticationError" in error_type or "invalid_api_key" in str(e).lower():
                print(f"\nError: Invalid API key. Please check your OPENAI_API_KEY in .env\n")
            elif "RateLimitError" in error_type or "rate_limit" in str(e).lower():
                print(f"\nError: Rate limit exceeded. Please wait a moment and try again.\n")
            elif "APIConnectionError" in error_type or "connection" in str(e).lower():
                print(f"\nError: Could not connect to OpenAI API. Check your internet connection.\n")
            elif "InsufficientQuotaError" in error_type or "quota" in str(e).lower():
                print(f"\nError: API quota exceeded. Please check your OpenAI account billing.\n")
            else:
                print(f"\nError: {error_type}: {str(e)}\n")
                print("If this persists, try 'clear' to reset conversation history.\n")


if __name__ == "__main__":
    asyncio.run(main())
